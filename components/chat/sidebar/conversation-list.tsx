"use client";

import { useId, useRef, useEffect } from "react";
import { Icon } from "@iconify-icon/react";
import {
  Listbox,
  ListboxItem,
  ListboxSection,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Pagination,
} from "@heroui/react";
import { GroupedConversations, sortTimePeriods } from "./types";

interface ConversationListProps {
  groupedConversations: GroupedConversations;
  activeConversationId: string | null;
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onConversationSelect: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}

export default function ConversationList({
  groupedConversations,
  activeConversationId,
  isLoading,
  hasMore,
  onLoadMore,
  onConversationSelect,
  onRename,
  onDelete,
}: ConversationListProps) {
  const id = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle scroll event to load more conversations
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Check if we're near the bottom (within 200px)
      const isNearBottom = 
        container.scrollHeight - container.scrollTop - container.clientHeight < 200;
      
      if (isNearBottom && hasMore && !isLoading) {
        onLoadMore();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoading, onLoadMore]);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-2 pt-1 pb-4">
      <Listbox
        color="primary"
        aria-label="Conversations"
        className="gap-2"
        selectionMode="single"
        selectedKeys={activeConversationId ? [activeConversationId] : []}
        onSelectionChange={(keys) => {
          const selectedKey = Array.from(keys)[0]?.toString();
          if (selectedKey) {
            onConversationSelect(selectedKey);
          }
        }}
        emptyContent="No chats yet."
      >
        {Object.keys(groupedConversations)
          .sort(sortTimePeriods)
          .map((timePeriod) => (
            <ListboxSection
              key={timePeriod}
              title={timePeriod}
              classNames={{
                base: "mt-2",
                heading: "font-semibold font-poppins text-foreground/60",
              }}
            >
              {groupedConversations[timePeriod].map((conv) => (
                <ListboxItem
                  key={conv.id}
                  textValue={conv.title}
                  aria-labelledby={`label-${id}`}
                  aria-describedby={`desc-${id}`}
                  classNames={{
                    selectedIcon: "hidden",
                    base: "data-[selected=true]:ring-primary data-[selected=true]:ring-2 data-[hover=true]:bg-primary/40 my-1 !text-foreground",
                  }}
                >
                  <div className="flex items-center gap-2 w-full h-8">
                    <div className="flex flex-row items-center justify-between w-full">
                      <div className="flex-shrink truncate text-sm max-w-[220px]">
                        {conv.title}
                      </div>
                      <div className="flex-none opacity-0 group-hover:opacity-100 transition-colors transition-opacity">
                        <Dropdown>
                          <DropdownTrigger>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              className="min-w-0 w-6 h-6 p-0"
                              onClick={(e) => e.stopPropagation()}
                              color="default"
                            >
                              <Icon
                                icon="tabler:dots-vertical"
                                width={16}
                                height={16}
                                className="text-foreground"
                              />
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu
                            onAction={(key) => {
                              if (key === "rename") {
                                onRename(conv.id, conv.title);
                              } else if (key === "delete") {
                                onDelete(conv.id);
                              }
                            }}
                          >
                            <DropdownItem
                              key="rename"
                              startContent={
                                <Icon
                                  icon="tabler:edit"
                                  width={16}
                                  height={16}
                                />
                              }
                            >
                              Rename
                            </DropdownItem>
                            <DropdownItem
                              key="delete"
                              className="text-danger"
                              color="danger"
                              startContent={
                                <Icon
                                  icon="tabler:trash"
                                  width={16}
                                  height={16}
                                />
                              }
                            >
                              Delete
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </div>
                    </div>
                  </div>
                </ListboxItem>
              ))}
            </ListboxSection>
          ))}
      </Listbox>

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center my-4">
          <div className="flex items-center gap-2">
            <Icon
              icon="tabler:loader-2"
              className="animate-spin text-primary"
              width={16}
              height={16}
            />
            <span className="text-sm text-foreground/60">Loading more...</span>
          </div>
        </div>
      )}
    </div>
  );
}
