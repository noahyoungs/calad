"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Icon } from "@iconify-icon/react";
import { createClientSideClient } from "@/utils/supabase/client";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { updateConversationTitle, deleteConversation } from "@/actions/actions";
import { useChatContext } from "@/contexts/chat-context";
import {
  Button,
  Input,
  Link as LinkUI,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  addToast,
} from "@heroui/react";
import Link from "next/link";
import ConversationList from "./conversation-list";
import { ChatSidebarProps, getTimePeriod } from "./types";
import { usePostHog } from "posthog-js/react";

export default function ChatSidebar({
  userId,
  initialConversations,
  userEmail,
  toggleSidebar,
  sidebarOpen,
}: ChatSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [conversations, setConversations] = useState(initialConversations);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    null
  );
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isNewChatPage, setIsNewChatPage] = useState(false);
  const [isSettingsPage, setIsSettingsPage] = useState(false);
  const { setActiveConversationTitle } = useChatContext();
  const posthogClient = usePostHog();

  // Infinite scroll state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const pageSize = 20; // Number of conversations per page

  const [userSubscription, setUserSubscription] = useState<{
    isPro: boolean;
    formattedStatus: string;
  } | null>(null);

  // Initial load of conversations
  useEffect(() => {
    const loadInitialConversations = async () => {
      setIsLoading(true);
      const supabase = createClientSideClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Get first page of conversations
        const { data: conversations, error } = await supabase
          .from("conversations")
          .select("*")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .range(0, pageSize - 1);

        if (conversations) {
          setConversations(conversations);
          setHasMore(conversations.length === pageSize);
        }
      }
      setIsLoading(false);
    };

    loadInitialConversations();
  }, [pathname]);

  // Function to load more conversations
  const loadMoreConversations = async () => {
    if (isLoading || !hasMore) return;
    
    setIsLoading(true);
    const supabase = createClientSideClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const nextPage = page + 1;
      const start = page * pageSize;
      const end = start + pageSize - 1;

      const { data: newConversations, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .range(start, end);

      if (newConversations && newConversations.length > 0) {
        // Filter out any conversations that already exist in the current list
        // to prevent duplicate keys
        setConversations((prev) => {
          const existingIds = new Set(prev.map(conv => conv.id));
          const uniqueNewConversations = newConversations.filter(
            conv => !existingIds.has(conv.id)
          );
          
          return [...prev, ...uniqueNewConversations];
        });
        
        setPage(nextPage);
        setHasMore(newConversations.length === pageSize);
      } else {
        setHasMore(false);
      }
    }
    setIsLoading(false);
  };

  // Group conversations by time period
  const groupedConversations = useMemo(() => {
    const grouped: { [key: string]: any[] } = {};

    conversations.forEach((conv) => {
      const timePeriod = getTimePeriod(conv.updated_at || conv.created_at);

      if (!grouped[timePeriod]) {
        grouped[timePeriod] = [];
      }

      grouped[timePeriod].push(conv);
    });

    return grouped;
  }, [conversations]);

  // Set up real-time subscription for conversation updates
  useEffect(() => {
    const supabase = createClientSideClient();

    // Subscribe to changes in the conversations table
    const subscription = supabase
      .channel("conversation-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("Received update:", payload.new);
          // Update the conversation in the local state
          setConversations((prevConversations) =>
            prevConversations.map((conv) => {
              if (conv.id === payload.new.id) {
                return { ...conv, ...payload.new };
              }
              return conv;
            })
          );
          
          // If this is the active conversation and the title changed, update it in context
          if (payload.new.id === activeConversationId && payload.new.title) {
            setTimeout(() => {
              setActiveConversationTitle(payload.new.title);
            }, 0);
          }
        }
      )
      .subscribe();

    // Clean up subscription on unmount
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [userId, activeConversationId, setActiveConversationTitle]);

  // Delete a conversation
  const handleDeleteConversation = async (id: string) => {
    try {
      startTransition(async () => {
        const result = await deleteConversation(id);

        if (!result.success) {
          addToast({
            title: "Error deleting conversation",
            description: result.error || "An unexpected error occurred",
            color: "danger",
          });
          return;
        }

        setConversations(conversations.filter((conv) => conv.id !== id));

        if (activeConversationId === id) {
          router.push("/app/chat");
          setActiveConversationId(null);
          setActiveConversationTitle("AI Assistant");
        }
      });
    } catch (error) {
      console.error("Error deleting conversation:", error);
      addToast({
        title: "Error deleting conversation",
        description: "An unexpected error occurred",
        color: "danger",
      });
    }
  };

  // Start editing a conversation title
  const startEditingTitle = (id: string, title: string) => {
    setEditingTitle(id);
    setNewTitle(title);
    setIsRenameModalOpen(true);
  };

  // Save the edited title
  const handleSaveTitle = async () => {
    if (!editingTitle) return;

    try {
      startTransition(async () => {
        const result = await updateConversationTitle(editingTitle, newTitle);

        if (!result.success) {
          addToast({
            title: "Error updating conversation title",
            description: result.error || "An unexpected error occurred",
            color: "danger",
          });
          return;
        }

        setConversations(
          conversations.map((conv) =>
            conv.id === editingTitle ? { ...conv, title: newTitle } : conv
          )
        );
        
        // Update the active conversation title in the context if this is the active conversation
        if (editingTitle === activeConversationId) {
          setActiveConversationTitle(newTitle);
        }

        setIsRenameModalOpen(false);
        setEditingTitle(null);
        setNewTitle("");
      });
    } catch (error) {
      console.error("Error updating title:", error);
      addToast({
        title: "Error updating conversation title",
        description: "An unexpected error occurred",
        color: "danger",
      });
    }
  };

  // Navigate to a conversation
  const navigateToConversation = (id: string) => {
    const conversation = conversations.find(conv => conv.id === id);
    if (conversation && conversation.title) {
      setActiveConversationTitle(conversation.title);
    }
    router.push(`/app/chat/conversation/${id}`);
  };

  // Extract conversation ID from pathname and check current page
  useEffect(() => {
    const match = pathname.match(/\/app\/chat\/conversation\/([^\/]+)/);
    if (match && match[1]) {
      const id = match[1];
      setActiveConversationId(id);
      
      // Set the conversation title in the context
      const conversation = conversations.find(conv => conv.id === id);
      if (conversation && conversation.title) {
        setActiveConversationTitle(conversation.title);
      }
      
      setIsNewChatPage(false);
      setIsSettingsPage(false);
    } else if (pathname === "/app/chat") {
      setActiveConversationId(null);
      setActiveConversationTitle("AI Assistant");
      setIsNewChatPage(true);
      setIsSettingsPage(false);
    } else if (pathname === "/app/chat/settings") {
      setActiveConversationId(null);
      setActiveConversationTitle("Settings");
      setIsNewChatPage(false);
      setIsSettingsPage(true);
    } else {
      setActiveConversationId(null);
      setIsNewChatPage(false);
      setIsSettingsPage(false);
    }
  }, [pathname, conversations, setActiveConversationTitle]);

  // Add this function for sign out
  const handleSignOut = async () => {
    const supabase = createClientSideClient();
    // Add PostHog reset call here
    if (posthogClient) {
      console.log("Calling posthogClient.reset()...");
      posthogClient.reset();
      console.log("posthogClient.reset() called.");
    } else {
      console.log("posthogClient from usePostHog() is not available for reset.");
    }
    await supabase.auth.signOut();
    router.push("/");
  };

  // Load subscription data
  useEffect(() => {
    async function loadSubscription() {
      const supabase = createClientSideClient();
      
      // Get the current user's subscription
      const { data: subscription, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is fine
        console.error("Error fetching subscription:", error);
        return;
      }

      // Format the subscription status
      let formattedStatus = "Free Plan";
      let isPro = false;

      if (subscription) {
        // Determine if the user is Pro
        isPro = subscription.is_active && subscription.plan_type === "plus";
        
        if (isPro) {
          formattedStatus = "cal.ad Plus";
        } else if (subscription.plan_type === "plus" && !subscription.is_active) {
          // Specifically handle Plus plans that are no longer active
          formattedStatus = "Inactive";
        } else {
          // Default to Free Plan for active free plans or if no specific Plus status applies
          formattedStatus = "Free Plan";
        }
      }

      setUserSubscription({
        isPro,
        formattedStatus
      });
    }
    
    loadSubscription();
  }, [userId]);

  return (
    <div className="flex flex-col h-full">
      {/* Top section with buttons and heading */}
      <div className="">
        <div className="flex justify-between items-center p-3">
          <Link href="/">
            <img
              src="/calad_logo.svg"
              alt="calad"
              className="w-20 text-default"
            />
          </Link>
          <div className="flex gap-2">
            <Button
              onPress={toggleSidebar}
              variant="light"
              size="sm"
              isIconOnly
              className="w-7 h-7 min-w-0"
              aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
              color="primary"
            >
              <Icon
                icon="tabler:layout-sidebar-left-collapse"
                className="text-primary"
                width={26}
                height={26}
              />
            </Button>
            <Button
              as={LinkUI}
              isIconOnly
              variant="light"
              href="/app/chat/"
              className="w-7 h-7 min-w-0 rounded-lg"
              color="primary"
              isDisabled={isNewChatPage}
            >
              <Icon
                icon="tabler:message-plus"
                className="text-primary"
                width={26}
                height={26}
              />
            </Button>
          </div>
        </div>
      </div>

      {/* Conversation list */}
      <ConversationList
        groupedConversations={groupedConversations}
        activeConversationId={activeConversationId}
        isLoading={isLoading}
        hasMore={hasMore}
        onLoadMore={loadMoreConversations}
        onConversationSelect={navigateToConversation}
        onRename={startEditingTitle}
        onDelete={handleDeleteConversation}
      />

      {/* Bottom user controls */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="grid grid-cols-[1fr,auto] gap-1">
          <div className="flex flex-col justify-center pl-1">
            <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
              {userEmail}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {userSubscription?.formattedStatus || "Loading..."}
              </span>

            </div>
          </div>
          <ThemeSwitcher />
          <Button
            onPress={handleSignOut}
            className="h-10 text-white"
            color="primary"
            startContent={<Icon icon="tabler:logout" width={20} height={20} />}
          >
            Sign Out
          </Button>
          <Button
            as={Link}
            href="/app/chat/settings"
            isIconOnly
            className="h-10"
            aria-label="Settings"
            variant="flat"
            color="primary"
            isDisabled={isSettingsPage}
          >
            <Icon
              icon="tabler:adjustments-horizontal"
              width={20}
              height={20}
              className="text-primary-600 dark:text-primary-300"
            />
          </Button>
        </div>
      </div>

      {/* Rename Modal */}
      <Modal
        isOpen={isRenameModalOpen}
        onOpenChange={(open) => {
          setIsRenameModalOpen(open);
          if (!open) {
            setEditingTitle(null);
          }
        }}
        size="sm"
      >
        <ModalContent>
          <ModalHeader>Rename Chat</ModalHeader>
          <ModalBody>
            <Input
              autoFocus
              label="Title"
              variant="bordered"
              color="primary"
              placeholder="Enter chat title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSaveTitle();
                }
              }}
            />
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              color="danger"
              onPress={() => {
                setIsRenameModalOpen(false);
                setEditingTitle(null);
              }}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleSaveTitle}
              isDisabled={!newTitle.trim()}
            >
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
