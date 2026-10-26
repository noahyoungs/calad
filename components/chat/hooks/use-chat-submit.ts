import { FormEvent } from 'react';

export function useChatSubmit(
  messages: any[],
  handleSubmit: (e: FormEvent<HTMLFormElement>, options?: any) => Promise<void>,
  handleAbortCalendarEvent: (toolCallId: string) => void
) {
  const handleSubmitWrapper = async (e: FormEvent<HTMLFormElement>, options?: any) => {
    e.preventDefault();
    console.log("Cleaning up pending tool calls");

    // Cancel any pending tool calls
    const lastAssistantMessage = messages.findLast((message: any) => message.role === 'assistant');
    if (lastAssistantMessage) {
      const toolIncovationParts = lastAssistantMessage.parts?.filter((part: any) => 
        part.type === 'tool-invocation' && part.toolInvocation?.state === 'call'
      );
      toolIncovationParts?.forEach((part: any) => {
        console.log("Cancelling tool call:", part.toolInvocation.toolCallId);
        handleAbortCalendarEvent(part.toolInvocation.toolCallId);
      });
    }

    // Pass the form submission with options to handleSubmit
    if (options?.experimental_attachments) {
      console.log("Submitting with attachments:", options.experimental_attachments);
      await handleSubmit(e, {
        experimental_attachments: options.experimental_attachments
      });
    } else {
      await handleSubmit(e);
    }
  };

  return { handleSubmitWrapper };
} 