import { NextResponse } from "next/server";
import { mg } from "@/utils/email/config";

// Verify Cloudflare Turnstile token
async function verifyTurnstileToken(token: string, ip: string) {
  const formData = new FormData();
  formData.append('secret', process.env.TURNSTILE_SECRET_KEY || '');
  formData.append('response', token);
  formData.append('remoteip', ip);

  try {
    const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData
    });

    const outcome = await result.json();
    return outcome.success;
  } catch (error) {
    console.error('Error verifying Turnstile token:', error);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    // Get client IP
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    
    // Parse request body
    const { name, email, subject, message, token } = await req.json();

    // Validate required fields
    if (!name || !email || !subject || !message || !token) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Verify Turnstile token (skip in development mode)
    if (process.env.NODE_ENV !== 'development') {
      const isTokenValid = await verifyTurnstileToken(token, ip as string);
      if (!isTokenValid) {
        return NextResponse.json(
          { error: "Turnstile verification failed" },
          { status: 400 }
        );
      }
    }

    // In development mode, just log the email and return success
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode - Email would be sent with the following data:');
      console.log({
        from: `Contact Form <${process.env.MAILGUN_EMAIL || 'noreply@example.com'}>`,
        to: ["noah@aldeoinnovations.com"],
        subject: `[Contact Form] ${subject}`,
        text: `
Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}
        `,
        'h:Reply-To': email
      });
      
      return NextResponse.json({ 
        success: true,
        message: "Email would be sent in production mode"
      }, { status: 200 });
    }
    
    // Send email using Mailgun in production
    try {
      const mailgunDomain = process.env.MAILGUN_DOMAIN || "";
      
      console.log('Sending email with Mailgun:', {
        domain: mailgunDomain,
        from: "contact_form@cal.ad",
        to: "noah@aldeoinnovations.com"
      });
      
      await mg.messages.create(mailgunDomain, {
        from: `Contact Form <contact_form@cal.ad>`,
        to: ["noah@aldeoinnovations.com"],
        subject: `[Contact Form] ${subject}`,
        text: `
Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}
        `,
        html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #333; line-height: 1.5;">
  <h2>New Contact Form Submission</h2>
  
  <p><strong>Name:</strong> ${name}</p>
  <p><strong>Email:</strong> ${email}</p>
  <p><strong>Subject:</strong> ${subject}</p>
  
  <h3>Message:</h3>
  <p>${message.replace(/\n/g, '<br>')}</p>
</div>
        `,
        'h:Reply-To': email
      });

      return NextResponse.json({ success: true }, { status: 200 });
    } catch (emailError: any) {
      console.error('Error sending email:', emailError);
      return NextResponse.json(
        { error: "Failed to send email", details: emailError.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error processing contact form:', error);
    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}
