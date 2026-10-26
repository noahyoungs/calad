import { Icon } from '@iconify-icon/react';
import { Alert, Button } from "@heroui/react";

interface ChatErrorProps {
  error: Error;
  onRetry: () => void;
}

export default function ChatError({ error, onRetry }: ChatErrorProps) {
  return (
    <Alert
      color="danger"
      variant="bordered"
      className="mb-4"
      title="Error"
      description={error.message || "An unknown error occurred"}
      endContent={
        <Button 
          onPress={onRetry} 
          color="danger"
          variant="flat"
          size="sm"
          startContent={<Icon icon="tabler:refresh" width={14} height={14} />}
        >
          Retry
        </Button>
      }
    />
  );
} 