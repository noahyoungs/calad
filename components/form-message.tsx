import { Alert } from "@heroui/react";

export type Message =
  | { success: string }
  | { error: string }
  | { message: string };

export function FormMessage({ message }: { message: Message }) {
  return (
    <div className="flex flex-col gap-2 w-full max-w-md">
      {"success" in message && (
        <Alert color="success" variant="bordered">
          {message.success}
        </Alert>
      )}
      {"error" in message && (
        <Alert color="danger" variant="bordered">
          {message.error}
        </Alert>
      )}
      {"message" in message && (
        <Alert color="default" variant="bordered">
          {message.message}
        </Alert>
      )}
    </div>
  );
}
