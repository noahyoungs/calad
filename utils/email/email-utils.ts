import { createHash, createHmac } from "crypto";
import { mg } from "./config";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import { htmlSignature, plainTextSignature } from "./signature";
import { canVerifyEmail } from "@/utils/email-verification";

// Initialize DOMPurify with a DOM environment for server-side use
const window = new JSDOM("").window;
const purify = DOMPurify(window);

// Configure marked to prevent unwanted elements
marked.setOptions({
  gfm: true,
  breaks: true,
});

export function generateVerificationToken(
  email: string,
  userId: string,
  timestamp: number
): string {
  const data = `${email}:${userId}:${timestamp}:${process.env.APP_SECRET}`;
  return createHash("sha256").update(data).digest("hex");
}

/**
 * Check if an email has reached the rate limit for verification emails
 * @param email The email address to check
 * @returns Object containing whether the email is rate limited and the time remaining in the cooldown
 */
export async function checkEmailRateLimit(email: string): Promise<{ isRateLimited: boolean; timeRemaining?: number }> {
  try {
    const result = await canVerifyEmail(email);
    return {
      isRateLimited: !result.allowed,
      timeRemaining: result.timeRemaining
    };
  } catch (error) {
    console.error("Error checking email rate limit:", error);
    // If there's an error, allow the email to be sent as a fallback
    return { isRateLimited: false };
  }
}

/**
 * Sends a verification email to the provided email address
 * @param email Email address to send verification to
 * @param userId User ID for token generation
 * @param name Optional user name for personalization
 * @returns Promise resolving to the email send response
 * @throws Error if email sending fails
 */
export async function sendVerificationEmail(
  email: string,
  userId: string,
  name?: string
) {
  const timestamp = Date.now();
  const token = generateVerificationToken(email, userId, timestamp);
  const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/api/email/verify?email=${encodeURIComponent(email)}&userId=${userId}&t=${timestamp}&token=${token}`;

  console.debug(`Sending verification email to ${email} for user ${userId}`);

  try {
    const response = await mg.messages.create(process.env.MAILGUN_DOMAIN || "", {
      from: `cal.ad <${process.env.MAILGUN_EMAIL}>`,
      to: [email],
      subject: "✨ Verify your email for cal.ad",
      text: `Hi ${name || "there"}!

Welcome to cal.ad! I'm excited to help you manage your calendar through email. 🎉

To get started, please verify your email address by clicking this link:
${verificationLink}

This link will expire in 24 hours for security reasons.

If you didn't request this verification, you can safely ignore this email.

Talk soon,

${plainTextSignature}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #333; line-height: 1.5;">
          <p>Hi ${name || "there"}!</p>
          
          <p>I'm excited to help you manage your calendar through email. To get started, please verify your email address by clicking the link below:</p>
          
            <a href="${verificationLink}" 
               style="color: #7f8ee2; text-decoration: underline; font-weight: 500;">
              Verify Email Address
            </a>
          
          <p>This link will expire in 24 hours for security reasons.</p>
          
          <p>If you didn't request this verification, you can safely ignore this email.</p>
          
          <p>Talk soon,</p>
        </div>
        
        ${htmlSignature}
      `,
    });

    console.debug(`Successfully sent verification email to ${email}`);
    return response;
  } catch (error) {
    console.error(`Failed to send verification email to ${email}:`, error);
    throw error; // Re-throw to allow proper error handling by the caller
  }
}

// Verify Mailgun webhook signature
export async function verifyMailgunWebhook(
  formData: FormData
): Promise<boolean> {
  console.log("Checking webhook verification...");

  try {
    // Get Mailgun authentication parameters from form data
    const timestamp = formData.get("timestamp") as string;
    const token = formData.get("token") as string;
    const signature = formData.get("signature") as string;

    console.log("Form data auth parameters:", { timestamp, token, signature });

    if (!timestamp || !token || !signature) {
      console.log("Missing required form fields for verification");
      return false;
    }

    // 1. Concatenate timestamp and token values with no separator
    const concatenated = timestamp + token;

    // 2. Encode with HMAC algorithm using webhook signing key and SHA256 digest
    const signingKey = process.env.MAILGUN_WEBHOOK_SIGNING_KEY || "";
    console.log(
      "Using signing key (obscured):",
      signingKey.substring(0, 4) + "..."
    );

    const encodedToken = createHmac("sha256", signingKey)
      .update(concatenated)
      .digest("hex");

    console.log("Signature verification:", {
      expected: encodedToken,
      received: signature,
      matches: encodedToken === signature,
    });

    // 3. Compare the result to the signature
    return encodedToken === signature;
  } catch (error) {
    console.error("Error verifying webhook:", error);
    return false;
  }
}

/**
 * Sends a reply email to the provided recipient
 * @param to Email address of the recipient
 * @param subject Subject line for the email
 * @param body Message body content (will be converted from markdown to HTML)
 * @param originalMessage Optional original message to quote in the reply
 * @param recipientName Optional name of the recipient for the quoted section
 * @param inReplyToMessageId Optional Message-ID of the original email to reference in reply
 * @param references Optional References header from original email
 * @returns Promise resolving to the email send response
 */
export async function sendEmailReply(
  to: string,
  subject: string,
  body: string,
  originalMessage?: string,
  recipientName?: string,
  inReplyToMessageId?: string,
  references?: string
) {
  const now = new Date();
  const formattedDate = now.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
    timeZoneName: "short",
  });

  // Convert markdown to HTML for the new message only
  const rawHtml = marked.parse(body);
  const sanitizedHtml = purify.sanitize(rawHtml.toString(), {
    ALLOWED_TAGS: [
      "p",
      "br",
      "b",
      "i",
      "em",
      "strong",
      "a",
      "ul",
      "ol",
      "li",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "blockquote",
      "code",
      "pre",
      "hr",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "div",
      "span",
      "svg",
      "path",
      "del",
    ],
    ALLOWED_ATTR: [
      "href",
      "style",
      "width",
      "height",
      "viewBox",
      "fill",
      "stroke",
      "stroke-linecap",
      "stroke-linejoin",
      "xmlns",
    ],
  });

  // For plain text, use standard email quoting and add signature
  let plainText = body + "\n" + plainTextSignature;
  if (originalMessage) {
    plainText += `\n\nOn ${formattedDate}, ${recipientName ? `${recipientName} <${to}>` : to} wrote:\n`;
    plainText += originalMessage
      .split("\n")
      .map((line) => `> ${line}`)
      .join("\n");
  }

  // For HTML, use minimal styling that lets email clients handle quote styling
  let html = `
    <style>
      .email-content table {
        border-collapse: collapse;
        margin: 15px 0;
        width: 100%;
        max-width: 800px;
      }
      .email-content th, 
      .email-content td {
        border: 1px solid #ddd;
        padding: 8px 12px;
        text-align: left;
      }
      .email-content th {
        background-color: #f5f5f5;
        font-weight: bold;
      }
      .email-content tr:nth-child(even) {
        background-color: #f9f9f9;
      }
      .email-content blockquote {
        margin: 15px 0;
        padding: 10px 20px;
        border-left: 4px solid #e0e0e0;
        background-color: #f8f8f8;
        color: #444;
      }
      .email-content blockquote blockquote {
        margin-left: 10px;
        border-left-color: #ccc;
      }
      .email-content blockquote blockquote blockquote {
        border-left-color: #aaa;
      }
    </style>
    <div class="email-content">${sanitizedHtml}</div>${htmlSignature}`;

  if (originalMessage) {
    html += `
      <br><br>
      On ${formattedDate}, ${recipientName ? `${recipientName} <${to}>` : to} wrote:<br>
      <blockquote type="cite">
        ${originalMessage.replace(/\n/g, "<br>")}
      </blockquote>
    `;
  }

  try {
    // Create a new Message-ID for this email
    const domain = process.env.MAILGUN_DOMAIN || "cal.ad";
    const randomString = Math.random().toString(36).substring(2, 15);
    const timestamp = Date.now();
    const messageId = `${randomString}.${timestamp}@${domain}`;

    // Create the message data for Mailgun.js
    const messageData: any = {
      from: `cal.ad <${process.env.MAILGUN_EMAIL}>`,
      to,
      subject,
      text: plainText,
      html,
    };

    // Add email threading headers
    // These are the critical headers for proper email threading
    // Format: headers use h: prefix (per Mailgun docs)
    if (inReplyToMessageId) {
      // Clean the ID and ensure angle brackets
      const cleanId = inReplyToMessageId.replace(/^<|>$/g, '');
      messageData["h:In-Reply-To"] = `<${cleanId}>`;
      
      if (references) {
        // Process and clean references string
        const refIds = references.split(' ')
          .map(r => r.trim())
          .filter(Boolean)
          .map(r => r.replace(/^<|>$/g, ''))
          .map(r => `<${r}>`);
          
        messageData["h:References"] = `${refIds.join(' ')} <${cleanId}>`;
      } else {
        messageData["h:References"] = `<${cleanId}>`;
      }
    }
    
    // Always include a Message-ID
    messageData["h:Message-ID"] = `<${messageId}>`;
    
    // Detailed logging for debugging
    console.log('SENDING EMAIL WITH HEADERS:', JSON.stringify({
      to,
      subject,
      "h:Message-ID": messageData["h:Message-ID"],
      "h:In-Reply-To": messageData["h:In-Reply-To"],
      "h:References": messageData["h:References"]
    }, null, 2));

    // Send via Mailgun API
    const mailgunDomain = process.env.MAILGUN_DOMAIN || "";
    return await mg.messages.create(mailgunDomain, messageData);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}
