import { Icon } from '@iconify-icon/react';
import { Spinner } from '@heroui/react';
import { Button } from '@heroui/react';

interface TypingIndicatorProps {
  onStop: () => void;
}

export default function TypingIndicator({ onStop }: TypingIndicatorProps) {
  return (
    <div className="flex items-center gap-3 p-2">
      <Spinner size="sm" color="primary" />
      <Button
        size="sm"
        color="primary"
        onPress={onStop}
        startContent={<Icon icon="tabler:cancel" className="text-background" width={18} height={18} />}
      >
        <span className="text-background">Stop</span>      </Button>
    </div>
  );
} 