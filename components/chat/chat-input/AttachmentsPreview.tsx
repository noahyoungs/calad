import { Icon } from "@iconify-icon/react";
import { Button, Badge, Image, Tooltip } from "@heroui/react";
import { AttachmentsPreviewProps } from "./types";

const AttachmentsPreview = ({
  attachments,
  onRemoveAttachment,
}: AttachmentsPreviewProps) => {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="w-full mb-2 p-3 pb-0 flex flex-wrap gap-2 items-start justify-start">
      {attachments.map((file, index) => (
        <Badge
          key={`attachment-preview-${index}`}
          isOneChar
          className="opacity-100 group-hover:opacity-100"
          color="danger"
          content={
            <Button
              isIconOnly
              radius="full"
              size="sm"
              variant="light"
              color="danger"
              onPress={() => onRemoveAttachment(index)}
            >
              <Icon className="text-white" icon="tabler:x" width={16} />
            </Button>
          }
        >
          <Tooltip
            content={file.name}
            placement="top"
            delay={0}
            closeDelay={0}
          >
            <div className="h-14 w-14 rounded-large border-small border-default-300 overflow-hidden">
              {file.type === "application/pdf" ? (
                <div className="h-full w-full flex items-center justify-center !bg-default-200">
                  <Icon
                    icon="tabler:file-type-pdf"
                    width={24}
                    className="text-danger"
                  />
                </div>
              ) : (
                <Image
                  alt={file.name}
                  className="h-full w-full object-cover"
                  src={URL.createObjectURL(file)}
                />
              )}
            </div>
          </Tooltip>
        </Badge>
      ))}
    </div>
  );
};

export default AttachmentsPreview; 