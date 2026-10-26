"use client";

import React, {
  FormEvent,
  ChangeEvent,
  useCallback,
  useState,
  useRef,
  useEffect,
} from "react";
import { Icon } from "@iconify-icon/react";
import { useDropzone } from "react-dropzone";
import { Button, Form } from "@heroui/react";
import { cn } from "@heroui/react";
import { VisuallyHidden } from "@react-aria/visually-hidden";
import axios from "axios";
import { usePostHog } from "posthog-js/react";

import PromptInput from "./chat-input/PromptInput";
import AttachmentsPreview from "./chat-input/AttachmentsPreview";
import { ChatInputProps, CloudAttachment } from "./chat-input/types";
import { useChatContext } from "@/contexts/chat-context";

const MAX_FILES = 5; // Define the maximum number of files allowed

export default function ChatInput({
  input,
  handleInputChange,
  handleSubmit,
  status,
  attachments,
  setAttachments,
  conversationId,
  ensureConversationExists,
  floating,
  className,
  error
}: ChatInputProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [message, setMessage] = useState<string>(input);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [cloudAttachments, setCloudAttachments] = useState<CloudAttachment[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const posthog = usePostHog();

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMessage(input);
  }, [input]);

  useEffect(() => {
    if (attachments && attachments.length > 0) {
      setFiles(Array.from(attachments));
    } else {
      setFiles([]);
    }
  }, [attachments]);

  const handleMessageChange = useCallback(
    (value: string) => {
      setMessage(value);
      setAttachmentError(null);
      const syntheticEvent = {
        target: { value },
      } as ChangeEvent<HTMLTextAreaElement>;
      handleInputChange(syntheticEvent);
    },
    [handleInputChange]
  );

  const { pendingConversationId: contextPendingConversationId, setPendingConversationId } = useChatContext();
  
  const uploadFilesToCloud = async (filesToUpload: File[]): Promise<{attachments: CloudAttachment[], conversationId: string}> => {
    setIsUploading(true);
    
    try {
      let finalConversationId: string;
      
      if (ensureConversationExists) {
        // Check if there's a pending conversation ID in context
        if (contextPendingConversationId) {
          // If we have a pending ID in context, prioritize it
          finalConversationId = contextPendingConversationId;
        } else if (conversationId) {
          // If we have a conversation ID from props, use it
          finalConversationId = conversationId;
        } else {
          // If neither exists, create a new conversation
          finalConversationId = await ensureConversationExists();
          // Important: Update the context with the new ID to ensure consistency
          setPendingConversationId(finalConversationId);
        }
      } else {
        // If we don't have the ensure function, use the provided ID
        finalConversationId = conversationId;
      }
      
      // Then reuse that ID for all files
      const uploadPromises = filesToUpload.map(file => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('conversationId', finalConversationId);
    
        return axios.post('/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        }).then(response => response.data);
      });
      
      const result = await Promise.all(uploadPromises);
      setCloudAttachments(result);
      return {
        attachments: result,
        conversationId: finalConversationId
      };
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const processFiles = useCallback(
    (droppedFiles: File[]) => {
      const validFiles = droppedFiles.filter((file) => {
        const isSvg = file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");
        const isPdf = file.type === "application/pdf";
        const isImage = file.type.startsWith("image/");

        if (isSvg) {
          console.warn("SVG files are not allowed");
          return false;
        }

        if (!isPdf && !isImage) {
          console.warn("Only PDF and image files are allowed");
          return false;
        }

        return true;
      });

      setAttachmentError(null);

      const currentAttachmentCount = attachments ? attachments.length : 0;
      let filesToActuallyAdd = validFiles;

      if (currentAttachmentCount + validFiles.length > MAX_FILES) {
        const slotsAvailable = MAX_FILES - currentAttachmentCount;
        
        if (slotsAvailable <= 0) {
          filesToActuallyAdd = []; // No space left, add no new files
        } else {
          filesToActuallyAdd = validFiles.slice(0, slotsAvailable);
        }

        if (posthog && validFiles.length > 0) {
          posthog.capture('file_attachment_limit_hit', {
            limit: MAX_FILES,
            attempted_to_add_count: validFiles.length,
            current_file_count: currentAttachmentCount,
            accepted_count: filesToActuallyAdd.length
          });
        }
        if (validFiles.length > 0) {
          setAttachmentError(`You can only attach a maximum of ${MAX_FILES} files.`);
        }
      }

      if (filesToActuallyAdd.length > 0) {
        const dataTransfer = new DataTransfer();

        if (attachments) {
          Array.from(attachments).forEach((file) => dataTransfer.items.add(file));
        }

        filesToActuallyAdd.forEach((file) => dataTransfer.items.add(file));
        setAttachments(dataTransfer.files);
      }
    },
    [setAttachments, attachments, posthog]
  );

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const selectedFiles = Array.from(e.target.files);
        processFiles(selectedFiles);
      }
    },
    [processFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/gif": [".gif"],
      "image/webp": [".webp"],
      "application/pdf": [".pdf"],
    },
    onDrop: processFiles,
    noClick: false,
    noKeyboard: false,
  });

  const clearAttachments = useCallback(
    (index?: number) => {
      if (typeof index === "number" && attachments) {
        const newFiles = Array.from(attachments);
        newFiles.splice(index, 1);

        if (newFiles.length === 0) {
          setAttachments(null);
        } else {
          const dataTransfer = new DataTransfer();
          newFiles.forEach((file) => dataTransfer.items.add(file));
          setAttachments(dataTransfer.files);
        }
      } else {
        setAttachments(null);
      }
      setAttachmentError(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      setCloudAttachments([]);
    },
    [setAttachments, attachments]
  );

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      const items = Array.from(e.clipboardData.items);
      const imageFiles: File[] = [];
      
      for (const item of items) {
        if (item.type.indexOf("image") !== -1) {
          const blob = item.getAsFile();
          if (!blob) continue;

          if (blob.type === "image/svg+xml" || blob.name.toLowerCase().endsWith(".svg")) {
            console.warn("SVG files are not allowed");
            continue;
          }

          imageFiles.push(blob);
        }
      }

      if (imageFiles.length > 0) {
        processFiles(imageFiles);
      }
    },
    [processFiles]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (status === "ready" && (message.trim() || (attachments && attachments.length > 0))) {
          handleFormSubmit(e as unknown as FormEvent<HTMLFormElement>);
        }
      }
    },
    [message, attachments, status]
  );

  const handleFormSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (isUploading) return;

      try {
        // Clear any previous attachment errors before attempting submission
        setAttachmentError(null);

        let finalConversationId: string = '';
        let attachmentsToSend: CloudAttachment[] = [];
        
        if (files.length > 0 && cloudAttachments.length === 0) {
          const uploadResult = await uploadFilesToCloud(files);
          attachmentsToSend = uploadResult.attachments;
          finalConversationId = uploadResult.conversationId;
        } else {
          attachmentsToSend = cloudAttachments;
          
          if (contextPendingConversationId) {
            finalConversationId = contextPendingConversationId;
          } 
          else if (conversationId) {
            finalConversationId = conversationId;
          } 
          else if (ensureConversationExists) {
            finalConversationId = await ensureConversationExists();
            setPendingConversationId(finalConversationId);
          }
        }

        if (!message.trim() && attachmentsToSend.length > 0) {
          handleMessageChange("See attatchments");
        }
      
        if (finalConversationId) {
          if (attachmentsToSend.length > 0) {
            await handleSubmit(e, {
              experimental_attachments: attachmentsToSend.map(attachment => ({
                name: attachment.name,
                contentType: attachment.contentType,
                url: attachment.url
              })),
              conversationId: finalConversationId
            });
          } else {
            await handleSubmit(e, {
              conversationId: finalConversationId
            });
          }
        } else {
          console.error('No valid conversation ID available');
        }

        clearAttachments();
        setCloudAttachments([]);
      } catch (error: any) {
        console.error('Error handling form submission:', error);
        let errorMessage = "Failed to upload attachments. Please try again.";
        if (error.response && error.response.data && typeof error.response.data.error === 'string') {
          errorMessage = error.response.data.error;
        }
        setAttachmentError(errorMessage);

        // Removed conditional logic, now always log on client-side if an error occurs here
        if (posthog) {
          // Determine the conversation ID that was attempted for the upload
          // This logic mirrors what's in the try block for setting finalConversationId
          let attemptedConversationId = conversationId; // Fallback to prop
          if (contextPendingConversationId) {
            attemptedConversationId = contextPendingConversationId;
          } else if (!conversationId && typeof ensureConversationExists === 'function') {
            // This case is less likely here as ensureConversationExists would have run or errored
            // but including for completeness if the structure changes.
            // For an error caught here, a new ID might not have been successfully established.
            attemptedConversationId = "pending_or_failed_to_create"; 
          }

          posthog.capture('chat_attachment_upload_failed', {
            failure_reason: errorMessage,
            raw_error_details: error.message || "Unknown error",
            conversation_id_attempted: attemptedConversationId
            // Consider adding filename if easily and reliably available at this point
            // e.g., if the error is tied to a single file upload attempt: error.response?.data?.filename
          });
        }
      }
    },
    [handleSubmit, files, cloudAttachments, isUploading, clearAttachments, message, handleMessageChange, conversationId, ensureConversationExists, setPendingConversationId, contextPendingConversationId, posthog]
  );

  const isSendDisabled = status !== "ready" || isUploading;

  return (
    <div className="w-full">
      <Form
        onSubmit={handleFormSubmit}
        className={cn(
          "relative w-full flex flex-col items-center gap-0 rounded-t-[2rem] sm:rounded-t-medium bg-content3",
          isDragActive && "ring-2 ring-primary",
          floating && "md:rounded-medium",
        )}
        {...getRootProps()}
      >
        <AttachmentsPreview
          attachments={files}
          onRemoveAttachment={clearAttachments}
        />
        <div className="w-full">
          <PromptInput
            ref={inputRef}
            autoFocus
            classNames={{
              innerWrapper: "relative",
              input: "text-medium h-auto w-full",
              inputWrapper:
                "!bg-transparent shadow-none group-data-[focus-visible=true]:ring-0 group-data-[focus-visible=true]:ring-offset-0 pr-12 pl-[20px] pt-3 pb-4",
              base: className,
            }}
            maxRows={16}
            minRows={1}
            name="content"
            placeholder={
              isDragActive
                ? "Drop files here..."
                : isUploading
                ? "Uploading files..."
                : "Type your message or drag an image/PDF here..."
            }
            radius="lg"
            spellCheck={false}
            value={message}
            variant="flat"
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onValueChange={handleMessageChange}
            disabled={isUploading}
            isLoading={status === "loading" || isUploading}
          />
          {(attachmentError || (error && error.message)) && (
            <p className="text-sm text-red-500 mt-1 ml-3">
              {attachmentError || (error && error.message)}
            </p>
          )}
        </div>

        <div className="flex w-full flex-row items-center justify-between px-3 pb-3">
          <Button
            type="button"
            onPress={() => fileInputRef.current?.click()}
            disabled={isSendDisabled}
            variant="light"
            isIconOnly
            radius="full"
            size="sm"
            color="primary"
          >
            <Icon
              className="text-primary"
              icon="tabler:paperclip"
              width={18}
              height={18}
            />
            <VisuallyHidden>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/png,.png,image/jpeg,.jpg,.jpeg,image/gif,.gif,image/webp,.webp,application/pdf,.pdf"
                onChange={handleFileChange}
                className="hidden"
                multiple
              />
            </VisuallyHidden>
          </Button>
          <Button
            type="submit"
            isDisabled={
              isSendDisabled ||
              (!message.trim() && (!attachments || attachments.length === 0))
            }
            isLoading={isUploading || status === "loading"}
            isIconOnly
            color="primary"
            size="sm"
            radius="full"
          >
            <Icon
              icon="tabler:arrow-up"
              className="text-background"
              alt="Send"
              width={18}
              height={18}
            />
          </Button>
        </div>
      </Form>
    </div>
  );
}
