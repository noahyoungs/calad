import { ChangeEvent, FormEvent } from "react";

export interface ChatInputProps {
  input: string;
  handleInputChange: (e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>, options?: any) => void;
  status: string;
  attachments: FileList | null;
  setAttachments: (files: FileList | null) => void;
  conversationId: string;
  ensureConversationExists?: () => Promise<string>;
  floating?: boolean;
  className?: string;
  error?: Error | null;
}

export interface CloudAttachment {
  url: string;
  name: string;
  contentType: string;
  filename?: string;
}

export interface AttachmentsPreviewProps {
  attachments: File[];
  onRemoveAttachment: (index: number) => void;
}
