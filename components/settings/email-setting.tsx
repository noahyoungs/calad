"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import { DataTable, ColumnDefinition } from "../ui/data-table";
import { 
  addToast, 
  cn, 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter, 
  Button, 
  Input,
  useDisclosure,
  Tooltip
} from "@heroui/react";
import { Icon } from "@iconify-icon/react";
import {
  addUserEmail,
  deleteUserEmail,
  resendVerificationEmail,
  UserEmail,
} from "@/actions/settings-actions";

interface EmailSettingCardProps {
  className?: string;
  initialEmails: UserEmail[];
}

const EmailSetting = React.forwardRef<HTMLDivElement, EmailSettingCardProps>(
  ({ className, initialEmails, ...props }, ref) => {
    const [emails, setEmails] = useState<UserEmail[]>(initialEmails);
    const [isPending, startTransition] = useTransition();
    const [newEmail, setNewEmail] = useState("");
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [resendingId, setResendingId] = useState<string | null>(null);

    // Column definitions for the email table
    const emailColumns: ColumnDefinition<UserEmail>[] = [
      { key: "email", label: "Email Address", required: true, editable: false },
      {
        key: "is_verified",
        label: "Verified",
        renderCell: (item) => (
          <div className="flex items-center gap-2">
            {item.is_verified ? (
              "Yes"
            ) : (
              <>
                <span>No</span>
                <Tooltip 
                  content="Resend verification email" 
                  color="primary"
                  placement="right"
                  showArrow
                  className="!text-white"
                >
                  <Button
                    size="sm"
                    variant="flat"
                    color="primary"
                    isIconOnly
                    isLoading={isPending && resendingId === item.id}
                    onPress={() => handleResendVerification(item)}
                    aria-label="Resend verification email"
                  >
                    <Icon icon="tabler:mail-forward" width="18" height="18" />
                  </Button>
                </Tooltip>
              </>
            )}
          </div>
        ),
        editable: false,
      },
    ];

    // Custom render function for actions to only show delete button
    const renderActions = (item: UserEmail) => (
      <div className="flex justify-start">
        <Button
          isIconOnly
          size="sm"
          variant="light"
          color="danger"
          onPress={() => handleDeleteEmail(item)}
        >
          <Icon icon="tabler:trash" width="18" height="18" />
        </Button>
      </div>
    );

    // Handle adding a new email
    const handleAddEmail = () => {
      if (!newEmail.trim()) {
        addToast({
          title: "Email is required",
          description: "Please enter a valid email address.",
          color: "warning",
        });
        return;
      }

      const formData = new FormData();
      formData.append("email", newEmail);

      startTransition(async () => {
        const result = await addUserEmail(formData);
        if (result.success && result.data) {
          setEmails((prev) => [...prev, result.data as UserEmail]);
          addToast({ title: "Email added successfully", color: "success" });
          setNewEmail(""); // Clear the input
          onClose(); // Close the modal
        } else {
          addToast({
            title: "Error adding email",
            description: result.error || "An unknown error occurred.",
            color: "danger",
          });
        }
      });
    };

    // Handle deleting an email
    const handleDeleteEmail = (item: UserEmail) => {
      // Remove the primary check to allow deletion of all emails
      const formData = new FormData();
      formData.append("emailId", item.id);

      startTransition(async () => {
        const result = await deleteUserEmail(formData);
        if (result.success) {
          setEmails((prev) => prev.filter((i) => i.id !== item.id));
          addToast({ title: "Email deleted successfully", color: "success" });
        } else {
          addToast({
            title: "Error deleting email",
            description: result.error || "An unknown error occurred.",
            color: "danger",
          });
        }
      });
    };

    // Handle resending verification email
    const handleResendVerification = (item: UserEmail) => {
      if (item.is_verified) return;
      
      const formData = new FormData();
      formData.append("emailId", item.id);
      
      setResendingId(item.id);
      
      startTransition(async () => {
        const result = await resendVerificationEmail(formData);
        if (result.success) {
          addToast({ 
            title: "Verification email sent", 
            description: "Please check your inbox and follow the verification link.",
            color: "success" 
          });
        } else {
          addToast({
            title: "Error sending verification email",
            description: result.error || "An unknown error occurred.",
            color: "danger",
          });
        }
        setResendingId(null);
      });
    };

    // Add Email button component for the table bottom content
    const AddEmailButton = () => (
      <Button 
        color="primary" 
        startContent={<Icon icon="tabler:plus" width="18" height="18" />}
        variant="flat"
        onPress={onOpen}
      >
        Add Email
      </Button>
    );

    return (
      <div ref={ref} className={cn("p-2", className)} {...props}>
        <div className="flex flex-col gap-2 mb-4">
          <h3 className="text-base font-medium text-default-700">Email Addresses</h3>
          <p className="text-sm font-normal text-default-400">
            Manage your email addresses. Verify your email to start sending emails.
          </p>
        </div>

        <DataTable<UserEmail>
          title=""
          description=""
          items={emails}
          columns={emailColumns}
          itemKey="id"
          actionsEnabled={true}
          addEnabled={false} // Disable built-in add functionality
          bottomContent={<AddEmailButton />} // Pass the Add Email button as bottomContent
          renderActions={renderActions}
        />

        {/* Custom Add Email Modal */}
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalContent>
            <ModalHeader>Add New Email Address</ModalHeader>
            <ModalBody>
              <Input
                type="email"
                label="Email Address"
                placeholder="Enter your email address"
                value={newEmail}
                onValueChange={setNewEmail}
                variant="bordered"
                color="primary"
                isRequired
                autoFocus
              />
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                Cancel
              </Button>
              <Button 
                color="primary" 
                onPress={handleAddEmail}
                isLoading={isPending}
                isDisabled={!newEmail.trim()}
                className="!text-white"
              >
                {isPending ? 'Adding...' : 'Add Email'}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    );
  }
);

EmailSetting.displayName = "EmailSetting";

export default EmailSetting;
