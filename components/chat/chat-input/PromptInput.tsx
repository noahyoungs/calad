import React from "react";
import { Textarea } from "@heroui/react";
import { cn } from "@heroui/react";

const PromptInput = React.forwardRef<HTMLTextAreaElement, any>(
  ({ classNames = {}, ...props }, ref) => {
    return (
      <Textarea
        ref={ref}
        aria-label="Message"
        classNames={{
          ...classNames,
          label: cn("hidden", classNames?.label),
          input: cn("py-0 !text-foreground", classNames?.input),
        }}
        minRows={1}
        placeholder={props.placeholder || "Type your message..."}
        radius="lg"
        variant="bordered"
        {...props}
      />
    );
  }
);

PromptInput.displayName = "PromptInput";

export default PromptInput; 