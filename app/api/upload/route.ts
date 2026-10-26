import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { uploadFile } from '@/utils/storage';
import cuid from 'cuid';
import path from 'path';
import { PDFDocument } from 'pdf-lib';

export const maxDuration = 60; // Allow 60 seconds for file uploads

export async function POST(req: NextRequest) {
  try {
    // Check user authentication
    const supabase = await createClient();
    const authResult = await supabase.auth.getUser();
    const user = authResult.data.user;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Using formData since it handles files better than JSON
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const conversationId = formData.get('conversationId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!conversationId) {
      return NextResponse.json({ error: 'No conversation ID provided' }, { status: 400 });
    }

    // Check file type (only allow images and PDFs)
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only images and PDF files are allowed' },
        { status: 400 }
      );
    }

    // Check file size (e.g., limit to 10MB)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds the 10MB limit' },
        { status: 400 }
      );
    }

    // PDF Page Count Check (only if it's a PDF)
    if (file.type === 'application/pdf') {
      const MAX_PAGES = 15;
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        const pageCount = pdfDoc.getPageCount();

        if (pageCount > MAX_PAGES) {
          return NextResponse.json(
            { error: `PDF exceeds the ${MAX_PAGES}-page limit` },
            { status: 400 }
          );
        }
      } catch (pdfError: any) {
        console.error('Error processing PDF for page count:', pdfError);
        return NextResponse.json(
          { error: 'Could not process PDF file to check page count.' },
          { status: 400 }
        );
      }
    }

    // Generate a CUID for the file and keep its original extension
    const fileExtension = path.extname(file.name);
    const filename = `${cuid()}${fileExtension}`;

    // Create the file path with user ID and conversation ID
    const filePath = `users/${user.id}/conversations/${conversationId}/${filename}`;

    // Upload file to Google Cloud Storage with the new path
    const result = await uploadFile(file, filePath);

    // Return the signed URL and filename
    return NextResponse.json({
      url: result.url,
      name: file.name,
      contentType: file.type,
      filename: result.filename,
    });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: error.message || 'Error uploading file' },
      { status: 500 }
    );
  }
} 