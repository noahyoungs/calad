"use client";

import * as React from "react";
import { Button, cn, Input, Spacer, addToast, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { MDXEditor } from "../ui/MDXEditor";
import { useState, useRef, useTransition, useEffect } from "react";
import { MDXEditorMethods } from "@mdxeditor/editor";
import TimeZoneSelector from "../calendar/TimeZoneSelector";
import { getLocalTimeZone } from "@internationalized/date";
import {
  updateUserSettings,
  UserSettings,
  deleteUserAccount,
} from "@/actions/settings-actions";
import { useRouter } from "next/navigation";
import { createClientSideClient } from "@/utils/supabase/client";

interface GeneralSettingCardProps {
  className?: string;
  initialSettings: UserSettings | null;
}

const GeneralSetting = React.forwardRef<
  HTMLDivElement,
  GeneralSettingCardProps
>(({ className, initialSettings, ...props }, ref) => {
  const router = useRouter();
  const editorRef = useRef<MDXEditorMethods>(null);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Initialize state from props
  const [name, setName] = useState(initialSettings?.name ?? "");
  const [timeZone, setTimeZone] = useState(
    initialSettings?.timezone ?? getLocalTimeZone()
  );
  // Use state for markdown content to ensure editor updates correctly
  const [customInstructions, setCustomInstructions] = useState(
    initialSettings?.custom_instructions ?? ""
  );

  // Keep MDXEditor synced if initial prop changes (though unlikely in this setup)
  useEffect(() => {
    setCustomInstructions(initialSettings?.custom_instructions ?? "");
  }, [initialSettings?.custom_instructions]);


  const handleUpdate = async () => {
    const currentInstructions = editorRef.current?.getMarkdown() ?? "";
    setCustomInstructions(currentInstructions); // Update state just before submitting

    const formData = new FormData();
    formData.append("name", name || ""); // Ensure empty string if null/undefined
    formData.append("timezone", timeZone);
    formData.append("custom_instructions", currentInstructions);

    startTransition(async () => {
      const result = await updateUserSettings(formData);
      if (result.success) {
        addToast({ 
          title: "Settings updated", 
          description: "Your settings have been saved successfully.",
          color: "success" 
        });
      } else {
        addToast({
          title: "Error updating settings",
          description: result.error || "An unknown error occurred",
          color: "danger",
        });
      }
    });
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteUserAccount();
      if (result.success) {
        addToast({ 
          title: "Account deleted", 
          description: "Your account has been successfully deleted.",
          color: "success" 
        });
        // Sign out the user
        const supabase = createClientSideClient();
        await supabase.auth.signOut();
        router.push("/");
      } else {
        addToast({
          title: "Error deleting account",
          description: result.error || "An unknown error occurred",
          color: "danger",
        });
        setIsDeleteModalOpen(false);
      }
    } catch (error) {
      addToast({
        title: "Error deleting account",
        description: "An unexpected error occurred",
        color: "danger",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div ref={ref} className={cn("p-2", className)} {...props}>
      {/* Name */}
      <div>
        <p className="text-base font-medium text-default-700">Name</p>
        <p className="mt-1 text-sm font-normal text-default-400">
          What should cal.ad call you?
        </p>
        <Input
          className="mt-2"
          color="primary"
          variant="bordered"
          value={name}
          onValueChange={setName} // Use onValueChange for controlled input
        />
      </div>
      <Spacer y={4} />

      {/* Default Time Zone */}
      <div>
        <p className="text-base font-medium text-default-700">
          Default Time Zone
        </p>
        <p className="mt-1 text-sm font-normal text-default-400">
          cal.ad will use this time zone for new events, if not specified
          otherwise.
        </p>
        <div className="mt-2 flex gap-2">
          <div className="flex-1">
            <TimeZoneSelector
              id="default-timezone"
              selectedTimeZone={timeZone}
              onTimeZoneChange={setTimeZone}
              label=""
              variant="bordered"
              // helpText="This will be used as the default time zone for new events."
            />
          </div>
          <div className="flex items-end">
            <Button 
              color="primary" 
              variant="flat" 
              size="md"
              onPress={() => {
                const localTimeZone = getLocalTimeZone();
                setTimeZone(localTimeZone);
                addToast({ 
                  title: "Time zone updated", 
                  description: `Set to system time zone: ${localTimeZone}`,
                  color: "success" 
                });
              }}
            >
              Use Local
            </Button>
          </div>
        </div>
      </div>
      <Spacer y={4} />

      {/* Custom Prompt */}
      <div>
        <p className="text-base font-medium text-default-700">
          Custom Instructions
        </p>
        <p className="mt-1 text-sm font-normal text-default-400">
          Provide any instructions for cal.ad to follow.
        </p>
        <div className="mt-2 border border-default-200 rounded-medium overflow-hidden !text-foreground">
          {/* Use key to force re-render if initial markdown changes, ensuring editor updates */}
          <MDXEditor
            key={initialSettings?.custom_instructions}
            ref={editorRef}
            markdown={customInstructions}
            onChange={setCustomInstructions} // Keep state updated if needed, though getMarkdown on submit is primary
            className="min-h-[300px] w-full"
          />
        </div>
        <div className="mt-2 flex items-center justify-start"> {/* Removed justify-between */}
          <p className="text-xs text-default-400">
            You can use markdown formatting, create lists, and more.
          </p>
          {/* Removed Reset Button */}
        </div>
      </div>

      <Spacer y={6} />

      <div className="flex gap-2">
        <Button color="primary" onPress={handleUpdate} isLoading={isPending} className="!text-white">
          {isPending ? "Updating..." : "Update"}
        </Button>
      </div>

      <Spacer y={8} />
      
      {/* Delete Account Section */}
      <div className="border-t border-divider pt-6">
        <p className="text-base font-medium">Delete Account</p>
        <p className="mt-1 text-sm font-normal text-default-400">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <div className="mt-4">
          <Button 
            color="danger" 
            onPress={() => setIsDeleteModalOpen(true)}
            className="!text-white"
          >
            Delete Account
          </Button>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        backdrop="blur"
        placement="center"
        isDismissable={!isDeleting}
        isKeyboardDismissDisabled={isDeleting}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-danger">
                Delete Account Confirmation
              </ModalHeader>
              <ModalBody>
                <p>
                  Are you sure you want to delete your account?<br />This will permanently remove:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Your profile and all personal information</li>
                  <li>All your calendars and calendar connections</li>
                  <li>All conversation history and uploaded files</li>
                  <li>All associated data from our system</li>
                </ul>
                <p className="mt-2">
                  <span className="font-medium">If you have a cal.ad Plus subscription:</span> Your subscription will be automatically canceled and you will no longer be charged. No refunds will be issued for the current billing period.
                </p>
                <p className="mt-2 font-medium">This action cannot be undone.</p>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="default"
                  variant="flat"
                  onPress={onClose}
                  isDisabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  color="danger"
                  onPress={handleDeleteAccount}
                  isLoading={isDeleting}
                  className="font-medium !text-white"
                >
                  {isDeleting ? "Deleting..." : "Permanently Delete My Account"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div> // This closes the main component div
  );
});

GeneralSetting.displayName = "GeneralSetting";

export default GeneralSetting;
