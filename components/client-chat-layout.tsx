'use client';

import { ReactNode, useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import ChatSidebar from "@/components/chat/sidebar";
import { ChatProvider, useChatContext } from '@/contexts/chat-context';
import { Icon } from "@iconify-icon/react";
import { Button, Link, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Textarea, Form } from "@heroui/react";
import { createClientSideClient } from "@/utils/supabase/client";
import { Turnstile } from '@marsidev/react-turnstile';

interface ClientChatLayoutProps {
  userId: string;
  userEmail?: string;
  initialConversations: any[];
  children: ReactNode;
}

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  token: string;
}

function ClientChatLayoutContent({
  userId,
  userEmail,
  initialConversations,
  children
}: ClientChatLayoutProps) {
  const [forceUpdate, setForceUpdate] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isNewChatPage, setIsNewChatPage] = useState(false);
  const [isSettingsPage, setIsSettingsPage] = useState(false);
  const { sidebarOpen, setSidebarOpen } = useChatContext();
  const pathname = usePathname();
  
  // Contact modal state
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactFormData, setContactFormData] = useState<ContactFormData>({
    name: "",
    email: userEmail || "",
    subject: "Help Request",
    message: "",
    token: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });
  const turnstileRef = useRef<any>(null);

  // Get user data from Supabase
  useEffect(() => {
    const fetchUserData = async () => {
      const supabase = createClientSideClient();
      const { data } = await supabase.auth.getSession();
      
      if (data.session?.user) {
        const user = data.session.user;
        
        setContactFormData(prev => ({
          ...prev,
          name: user.user_metadata?.full_name || "",
          email: user.email || userEmail || "",
        }));
      }
    };
    
    fetchUserData();
  }, [userEmail]);

  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    setContactFormData((prev) => ({ ...prev, [field]: value }));
    // Clear form status when user starts typing again
    if (formStatus.type) {
      setFormStatus({ type: null, message: "" });
    }
  };

  const handleTurnstileVerify = (token: string) => {
    setContactFormData((prev) => ({ ...prev, token }));
  };

  const handleTurnstileError = () => {
    setFormStatus({
      type: "error",
      message: "Turnstile verification failed. Please try again.",
    });
  };

  const handleTurnstileExpire = () => {
    setContactFormData((prev) => ({ ...prev, token: "" }));
  };

  const handleContactSubmit = () => {
    // Validate form
    if (!contactFormData.name || !contactFormData.email || !contactFormData.subject || !contactFormData.message) {
      setFormStatus({
        type: "error",
        message: "Please fill in all required fields.",
      });
      return;
    }

    if (!contactFormData.token) {
      setFormStatus({
        type: "error",
        message: "Please complete the verification.",
      });
      return;
    }

    setIsSubmitting(true);
    setFormStatus({ type: null, message: "" });

    // Submit the form
    submitForm();
  };

  const submitForm = async () => {
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contactFormData),
      });

      const data = await response.json();

      if (response.ok) {
        setFormStatus({
          type: "success",
          message: "Your message has been sent successfully!",
        });
        // Reset form
        setContactFormData({
          name: "",
          email: userEmail || "",
          subject: "",
          message: "",
          token: "",
        });
        // Reset Turnstile
        if (turnstileRef.current) {
          turnstileRef.current.reset();
        }
        // Close modal after success (after a short delay)
        setTimeout(() => {
          setIsContactModalOpen(false);
          setFormStatus({ type: null, message: "" });
        }, 2000);
      } else {
        setFormStatus({
          type: "error",
          message: data.error || "Something went wrong. Please try again.",
        });
      }
    } catch (error) {
      setFormStatus({
        type: "error",
        message: "An error occurred. Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close sidebar on mobile when pathname changes
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [pathname, isMobile, setSidebarOpen]);

  // Check current route
  useEffect(() => {
    const match = pathname.match(/\/app\/chat\/conversation\/([^\/]+)/);
    if (match && match[1]) {
      setIsNewChatPage(false);
      setIsSettingsPage(false);
    } else if (pathname === "/app/chat") {
      setIsNewChatPage(true);
      setIsSettingsPage(false);
    } else if (pathname === "/app/chat/settings") {
      setIsNewChatPage(false);
      setIsSettingsPage(true);
    } else {
      setIsNewChatPage(false);
      setIsSettingsPage(false);
    }
  }, [pathname]);

  // Check screen size and set initial state
  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // Only set initial state once, and only on desktop
      if (!isInitialized && !mobile) {
        setSidebarOpen(true);
        setIsInitialized(true);
      }
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, [isInitialized, setSidebarOpen]);

  // Define toggle function
  const toggleSidebar = useCallback(() => {
    setSidebarOpen(!sidebarOpen);
  }, [setSidebarOpen, sidebarOpen]);

  // Reset Turnstile when modal is closed
  useEffect(() => {
    if (!isContactModalOpen && turnstileRef.current) {
      turnstileRef.current.reset();
    }
  }, [isContactModalOpen]);

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] relative overflow-hidden">
      {/* Left sidebar with conversations */}
      <div 
        className={`
          ${sidebarOpen ? "translate-x-0 w-72" : "-translate-x-full w-0 opacity-0"}
          ${isMobile ? "fixed" : "relative"}
          bg-content3 h-full z-40 transition-all duration-300 ease-in-out 
         shadow-sm overflow-hidden rounded-tr-[2rem] sm:rounded-tr-2xl
        `}
      >
        <ChatSidebar 
          key={forceUpdate}
          userId={userId}
          userEmail={userEmail}
          initialConversations={initialConversations}
          toggleSidebar={toggleSidebar}
          sidebarOpen={sidebarOpen}
        />
      </div>
      
      {/* Main content area */}
      <div 
        className={`transition-all duration-300 ease-in-out flex-1 min-w-0 ${isMobile ? "w-full" : sidebarOpen ? "w-[calc(100%-18rem)]" : "w-full"}`}
      >
        {/* Show buttons when sidebar is closed */}
        {!sidebarOpen && (
          <div className="absolute top-3 left-3 z-[100] flex items-center gap-2">
            <Button
              onPress={toggleSidebar}
              variant="light"
              size="sm"
              isIconOnly
              className="w-7 h-7 min-w-0"
              aria-label="Open sidebar"
              color="primary"
            >
              <Icon icon="tabler:layout-sidebar-left-expand" className="text-primary" width={26} height={26} />
            </Button>
            
            {!isNewChatPage && (
            <Button
              as={Link}
              isIconOnly
              variant="light"
              href="/app/chat/"
              className="w-7 h-7 min-w-0 rounded-lg"
              color="primary"
            >
              <Icon icon="tabler:message-plus" className="text-primary" width={26} height={26} />
            </Button>
            )}
          </div>
        )}
        
        {/* Contact button - always visible in upper right */}
        <div className="absolute top-3 right-3 z-[100]">
          <Button
            onPress={() => setIsContactModalOpen(true)}
            variant="light"
            size="sm"
            isIconOnly
            className="w-7 h-7 min-w-0"
            aria-label="Contact support"
            color="primary"
          >
            <Icon icon="tabler:mail-question" className="text-primary" width={26} height={26} />
          </Button>
        </div>
        
        <div className="h-[100dvh] max-h-[100dvh] overflow-auto">
          {children}
        </div>
      </div>

      {/* Overlay for mobile only */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={toggleSidebar}
        />
      )}
      
      {/* Contact Form Modal */}
      <Modal 
        isOpen={isContactModalOpen} 
        onOpenChange={(open) => setIsContactModalOpen(open)}
        placement="center"
        size="xl"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Get in Touch
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Input
                    label="Name"
                    placeholder="Your name"
                    value={contactFormData.name}
                    onValueChange={(value) => handleInputChange("name", value)}
                    isRequired
                    autoFocus
                  />
                  
                  <Input
                    type="email"
                    label="Email"
                    placeholder="your.email@example.com"
                    value={contactFormData.email}
                    onValueChange={(value) => handleInputChange("email", value)}
                    isRequired
                  />
                  
                  <Input
                    label="Subject"
                    placeholder="What's this about?"
                    value={contactFormData.subject}
                    onValueChange={(value) => handleInputChange("subject", value)}
                    isRequired
                  />
                  
                  <Textarea
                    label="Message"
                    placeholder="Your message here..."
                    value={contactFormData.message}
                    onValueChange={(value) => handleInputChange("message", value)}
                    isRequired
                    minRows={8}
                  />
                  
                  <div className="flex justify-center my-2">
                    <Turnstile
                      ref={turnstileRef}
                      siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                      onSuccess={handleTurnstileVerify}
                      onError={handleTurnstileError}
                      onExpire={handleTurnstileExpire}
                    />
                  </div>
                  
                  {formStatus.type && (
                    <div
                      className={`p-3 rounded-lg ${
                        formStatus.type === "success" 
                          ? "bg-green-500/20 text-green-600" 
                          : "bg-red-500/20 text-red-600"
                      }`}
                    >
                      <p className="flex items-center gap-2 text-sm">
                        {formStatus.type === "success" ? (
                          <Icon icon="tabler:check-circle" width={16} />
                        ) : (
                          <Icon icon="tabler:alert-circle" width={16} />
                        )}
                        {formStatus.message}
                      </p>
                    </div>
                  )}
                </div>
              </ModalBody>
              <ModalFooter>
                <div className="flex gap-2">
                  <Button 
                    color="danger" 
                    variant="light" 
                    onPress={onClose}
                    isDisabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    color="primary" 
                    className="!text-white"
                    isLoading={isSubmitting}
                    isDisabled={isSubmitting}
                    onPress={handleContactSubmit}
                  >
                    Submit
                  </Button>
                </div>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}

export default function ClientChatLayout(props: ClientChatLayoutProps) {
  return (
    <ChatProvider>
      <ClientChatLayoutContent {...props} />
    </ChatProvider>
  );
} 