import { Storage } from '@google-cloud/storage';
import cuid from 'cuid';

const credentials = {
  client_email: process.env.GCP_CLIENT_EMAIL,
  private_key: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  project_id: process.env.GCP_PROJECT_ID,
}

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  credentials
});

const bucketName = process.env.GCS_BUCKET_NAME || 'calendar-ai-attachments';
let bucket: any = null;

// Default URL expiration time (2 hours)
const DEFAULT_EXPIRATION = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

// Get the bucket reference
async function getBucket() {
  if (bucket) return bucket;
  
  bucket = storage.bucket(bucketName);
  return bucket;
}

// Convert a blob or file to a Buffer for GCS upload
async function fileToBuffer(file: File | Blob): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Generate a signed URL for a file
 * @param filename The name of the file in the bucket
 * @param expirationMs How long the URL should be valid (in milliseconds)
 * @returns A signed URL that can be used to access the file
 */
export async function getSignedUrl(filename: string, expirationMs = DEFAULT_EXPIRATION): Promise<string> {
  const bucketRef = await getBucket();
  const fileRef = bucketRef.file(filename);
  
  // Set expiration date
  const expires = Date.now() + expirationMs;
  
  // Generate signed URL
  const [url] = await fileRef.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires,
  });
  
  return url;
}

/**
 * Uploads a file to Google Cloud Storage and returns a signed URL
 */
export async function uploadFile(file: File | Blob, filePath?: string): Promise<{
  url: string;
  filename: string;
  contentType: string;
}> {
  const bucketRef = await getBucket();
  
  // Use the provided file path or generate a unique file name
  const uniqueFileName = filePath || `${cuid()}-${(file as any).name || 'attachment'}`;
  
  // Create a reference to the file in the bucket
  const fileRef = bucketRef.file(uniqueFileName);
  
  try {
    // Convert file to Buffer
    const buffer = await fileToBuffer(file);
    
    // Upload the file
    await fileRef.save(buffer, {
      contentType: file.type,
      metadata: {
        contentType: file.type,
        cacheControl: 'public, max-age=31536000',
      },
    });
    
    // Generate a signed URL
    const signedUrl = await getSignedUrl(uniqueFileName);
    
    return {
      url: signedUrl,
      filename: uniqueFileName,
      contentType: file.type,
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

// Convert a FileList to attachment objects with GCS signed URLs
export async function convertFilesToAttachments(files: FileList): Promise<Array<{
  name: string;
  contentType: string;
  url: string;
  filename?: string; // Store the filename for later URL refreshing
}>> {
  const attachments = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const result = await uploadFile(file);
    
    attachments.push({
      name: file.name,
      contentType: file.type,
      url: result.url,
      filename: result.filename, // Store the filename for future URL refreshing
    });
  }
  
  return attachments;
} 