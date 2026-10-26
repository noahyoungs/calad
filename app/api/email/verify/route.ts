import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { createHash } from "crypto";

// Helper to generate verification token
function generateVerificationToken(email: string, userId: string, timestamp: number): string {
  const data = `${email}:${userId}:${timestamp}:${process.env.APP_SECRET}`;
  return createHash('sha256').update(data).digest('hex');
}

// Helper to verify token
function verifyToken(email: string, userId: string, timestamp: number, token: string): boolean {
  const expectedToken = generateVerificationToken(email, userId, timestamp);
  return token === expectedToken && (Date.now() - timestamp) < 24 * 60 * 60 * 1000; // 24 hour expiry
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const userId = searchParams.get('userId');
    const timestamp = parseInt(searchParams.get('t') || '0');
    const token = searchParams.get('token');

    if (!email || !userId || !timestamp || !token) {
      return new Response('Invalid verification link', { status: 400 });
    }

    if (!verifyToken(email, userId, timestamp, token)) {
      return new Response('Invalid or expired verification link', { status: 400 });
    }

    const supabase = await createClient();

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response('Authentication required', { status: 401 });
    }

    // Verify the authenticated user matches the userId in the token
    if (user.id !== userId) {
      return new Response('Unauthorized - email verification must be done by the account owner', { status: 403 });
    }
    
    // Update email verification status
    const { error } = await supabase
      .from('user_emails')
      .update({ is_verified: true })
      .eq('email', email)
      .eq('user_id', userId); // Add user_id check for extra security

    if (error) {
      console.error('Error verifying email:', error);
      return new Response('Error verifying email', { status: 500 });
    }

    // Redirect to success page
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/settings/email-verified'
      }
    });
  } catch (error) {
    console.error('Error in email verification:', error);
    return new Response('Server error', { status: 500 });
  }
} 