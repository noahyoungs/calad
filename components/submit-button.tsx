"use client";

import { Button } from "@heroui/react";
import { type ButtonProps } from "@heroui/react";
import { type ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { Spinner } from "@heroui/react";

type Props = ButtonProps & {
  pendingText?: string;
};

export function SubmitButton({
  children,
  pendingText = "Submitting...",
  ...props
}: Props) {
  const { pending } = useFormStatus();

  return (
    <Button 
      type="submit" 
      disabled={pending} 
      {...props}
    >
      {pending ? (
        <div className="flex items-center gap-2">
          <Spinner size="sm" color="current" />
          <span>{pendingText}</span>
        </div>
      ) : children}
    </Button>
  );
}
