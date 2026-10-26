import { ALLOWED_MIME_TYPES } from './config';
import { MessagePart, TextPart, ImagePart, FilePart } from './types';

// Helper function to convert attachment to base64 data URL
export async function attachmentToDataUrl(attachment: any): Promise<string | null> {
  console.log('Processing attachment:', {
    hasData: !!attachment.data,
    contentType: attachment.contentType || attachment['content-type'],
    filename: attachment.filename || 'unknown'
  });

  try {
    // Get the attachment data from formData
    const contentType = attachment.contentType || attachment['content-type'];
    console.log('Checking MIME type:', {
      contentType,
      isAllowed: ALLOWED_MIME_TYPES.has(contentType)
    });

    if (!ALLOWED_MIME_TYPES.has(contentType)) {
      console.log('Attachment skipped - unsupported MIME type:', contentType);
      return null;
    }

    // Convert the attachment data to base64
    const buffer = Buffer.from(attachment.data);
    const base64Data = buffer.toString('base64');
    console.log('Successfully converted attachment to base64');
    return `data:${contentType};base64,${base64Data}`;
  } catch (error) {
    console.error('Error converting attachment to data URL:', error);
    return null;
  }
}

export async function processAttachments(
  attachments: any[],
  emailText: string,
  sender: string,
  subject: string
): Promise<MessagePart[]> {
  const messageParts: MessagePart[] = [];

  // Add the text part first
  const textPart: TextPart = {
    type: 'text',
    text: `Email from: ${sender}\nSubject: ${subject}\n\n${emailText}`
  };
  messageParts.push(textPart);

  console.log('Processing attachments:', {
    attachmentCount: attachments.length,
    attachmentTypes: attachments.map(a => a.contentType)
  });

  // Process attachments
  for (const attachment of attachments) {
    console.log('Converting attachment to data URL:', {
      contentType: attachment.contentType,
      filename: attachment.filename
    });

    const dataUrl = await attachmentToDataUrl(attachment);
    console.log('Data URL conversion result:', {
      success: !!dataUrl,
      length: dataUrl ? dataUrl.length : 0
    });

    if (!dataUrl) {
      console.log('Skipping attachment - no valid data URL generated');
      continue;
    }

    const contentType = attachment.contentType;
    const fileName = attachment.filename;

    if (contentType.startsWith('image/')) {
      console.log('Adding image part:', { contentType, fileName });
      const imagePart: ImagePart = {
        type: 'image',
        image: dataUrl,
        mimeType: contentType
      };
      messageParts.push(imagePart);
    } else {
      console.log('Adding file part:', { contentType, fileName });
      const filePart: FilePart = {
        type: 'file',
        data: dataUrl,
        mimeType: contentType
      };
      messageParts.push(filePart);
    }
  }

  console.log('Final message parts:', {
    totalParts: messageParts.length,
    types: messageParts.map(part => part.type)
  });

  return messageParts;
} 