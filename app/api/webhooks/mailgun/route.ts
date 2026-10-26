import { NextResponse } from "next/server";
import { generateText, tool } from "ai";
import { verifyMailgunWebhook } from "@/utils/email/email-utils";
import { VERIFY_WEBHOOK, VERIFY_SPAM_FILTER, RECIPIENT_EMAIL } from '../../../../utils/email/config';
import { vertex, openai } from "@/utils/ai-config";
import { generateEmailSystemPrompt } from "@/utils/email/email-system-prompt";
import { processAttachments } from '@/utils/email/attachment-utils';
import { getCalendarEvent } from '@/utils/calendar/get-event-utils';
import { createEmailTools } from '../../../../utils/email/tools';
import { ToolSet } from "ai";
import { isProUserAdmin } from "@/utils/subscription-utils";
import { createAdminClient } from '@/utils/supabase/admin';
import { formatEventDate } from "@/utils/email/tools";
import { repairToolCall } from "@/utils/repairToolCall";
// Flag to enable advanced calendar features (view, modify, delete) will be determined per user

// Set maximum duration to 60 seconds to allow email processing time
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    console.log('Received webhook request:', {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries())
    });

    // Parse the incoming email data once
    const formData = await req.formData();
    const sender = formData.get('sender') as string;
    const subject = formData.get('subject') as string;
    const recipient = formData.get('recipient') as string;
    const bodyPlain = formData.get('body-plain') as string;
    
    // Get Mailgun's spam check headers
    const spamFlag = formData.get('X-Mailgun-Sflag') as string;
    const spamScore = parseFloat(formData.get('X-Mailgun-Sscore') as string || '0');
    const dkimResult = formData.get('X-Mailgun-Dkim-Check-Result') as string;
    const spfResult = formData.get('X-Mailgun-Spf') as string;
    
    // Get email threading headers - handle different possible casings for Message-Id
    let messageId = formData.get('Message-Id') as string;
    if (!messageId) {
      messageId = formData.get('message-id') as string || formData.get('Message-ID') as string || '';
    }
    
    // Ensure messageId has proper angle brackets if not already present
    if (messageId && !messageId.startsWith('<')) {
      messageId = `<${messageId.trim()}>`;
    }
    
    const references = formData.get('References') as string;
    
    const attachmentCount = parseInt(formData.get('attachment-count') as string || '0');
    
    console.log('Parsed form data:', {
      sender,
      subject,
      recipient,
      messageId,
      references,
      attachmentCount,
      spamDetails: {
        spamFlag,
        spamScore,
        dkimResult,
        spfResult
      },
      allFields: Array.from(formData.entries()).map(([key]) => key)
    });

    // Process attachments if any
    const attachments = [];
    for (let i = 1; i <= attachmentCount; i++) {
      const attachment = formData.get(`attachment-${i}`);
      console.log(`Processing attachment ${i}:`, {
        exists: !!attachment,
        type: attachment ? typeof attachment : 'N/A',
        isFile: attachment instanceof File,
        isBlob: attachment instanceof Blob
      });
      
      if (attachment) {
        // Convert File or Blob to a plain object with the necessary properties
        const attachmentObj = {
          data: attachment instanceof File ? await attachment.arrayBuffer() : attachment,
          contentType: attachment instanceof File ? attachment.type : undefined,
          filename: attachment instanceof File ? attachment.name : 'attachment'
        };
        attachments.push(attachmentObj);
      }
    }

    console.log('Collected attachments:', {
      count: attachments.length,
      types: attachments.map(a => a.contentType)
    });

    if (recipient !== RECIPIENT_EMAIL) {
      console.log('Email rejected due to incorrect recipient:', {
        recipient,
        expectedRecipient: RECIPIENT_EMAIL
      });
      return NextResponse.json({ error: "Email rejected due to incorrect recipient" }, { status: 406 });
    }

    if (VERIFY_WEBHOOK) {
      try {
        const isValid = await verifyMailgunWebhook(formData);
        if (!isValid) {
          console.log('Webhook verification failed for URL:', req.url);
          return NextResponse.json({ error: "Invalid webhook signature" }, { status: 406 });
        }
        console.log('Webhook verification succeeded!');
      } catch (verifyError) {
        console.error('Error during webhook verification:', verifyError);
        return NextResponse.json({ error: "Webhook verification error" }, { status: 406 });
      }
    }

    // Check spam validation using Mailgun's spam detection
    console.log('Spam filter status:', {
      spamFlag,
      spamScore,
      dkimResult,
      spfResult,
      checkingEnabled: VERIFY_SPAM_FILTER
    });

    // Reject emails that are flagged as spam or have failed authentication
    if (VERIFY_SPAM_FILTER && (
      spamFlag === 'Yes' || 
      spamScore > 5 || // Adjust this threshold as needed
      (dkimResult && dkimResult.toLowerCase() !== 'pass') ||
      (spfResult && spfResult.toLowerCase() !== 'pass')
    )) {
      console.log('Email rejected due to spam or authentication failure:', {
        spamFlag,
        spamScore,
        dkimResult,
        spfResult,
        sender,
        subject
      });
      
      return NextResponse.json({ error: "Email rejected due to spam detection or authentication failure" }, { status: 406 });
    }

    // Get user from email address mapping in Supabase
    console.log('Looking up user for email:', sender);
    
    // Create a direct Supabase admin client to bypass RLS
    const supabaseAdmin = createAdminClient();
    
    // Simple, direct case-insensitive email lookup
    const { data: dbUserEmail, error: lookupError } = await supabaseAdmin
      .from('user_emails')
      .select('user_id, is_verified, default_calendar, email, id')
      .ilike('email', sender)
      .maybeSingle();
    
    // Log lookup results
    console.log('Email lookup result:', {
      email: sender,
      found: !!dbUserEmail,
      error: lookupError ? lookupError.message : null,
      data: dbUserEmail ? {
        id: dbUserEmail.id,
        email: dbUserEmail.email,
        verified: dbUserEmail.is_verified
      } : null
    });

    // Handle email not found
    if (!dbUserEmail) {
      console.log('User not found for email:', sender);
      return NextResponse.json({ error: "User not found" }, { status: 406 });
    }

    if (!dbUserEmail.is_verified) {
      console.log('Unverified email attempt from:', sender);
      return NextResponse.json({ error: "Email not verified" }, { status: 406 });
    }

    // Check if this email has already been processed
    if (messageId) {
      try {
        const { data: existingEmail, error: duplicateCheckError } = await supabaseAdmin
          .from('processed_emails')
          .select('message_id, processed_at')
          .eq('message_id', messageId)
          .maybeSingle();

        if (duplicateCheckError) {
          console.error('Error checking for duplicate emails:', duplicateCheckError);
          // Continue processing even if the duplicate check fails
        } else if (existingEmail) {
          const processedTime = new Date(existingEmail.processed_at).toISOString();
          console.log('Duplicate email detected with message ID:', messageId, 'originally processed at:', processedTime);
          return NextResponse.json({ error: "Duplicate email", details: { originalProcessingTime: processedTime } }, { status: 406 });
        }

        // If not a duplicate, insert into processed_emails table
        const { error: insertError } = await supabaseAdmin
          .from('processed_emails')
          .insert({
            message_id: messageId,
            user_id: dbUserEmail.user_id,
            subject: subject,
            sender: sender
          });
        
        if (insertError) {
          console.error('Error recording message ID in processed_emails table:', insertError);
          // Continue processing even if recording fails
        } else {
          console.log('Recorded message ID to prevent duplicate processing:', messageId);
        }
      } catch (duplicateError) {
        console.error('Exception during duplicate check:', duplicateError);
        // Continue processing despite the error
      }
    } else {
      console.warn('Email missing Message-Id header, cannot detect duplicates');
    }

    // Process the email and wait for it to complete
    // Note: Email event limit checking and recording is now handled in the createEmailTools function
    await processEmailAsync(dbUserEmail, sender, subject, bodyPlain, attachments, messageId, references);

    // Return success response after processing is complete
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error processing email:', error);
    return NextResponse.json({ error: error.message }, { status: 406 });
  }
}

// Async function to handle the rest of the processing
async function processEmailAsync(
  userEmail: { user_id: string } | null,
  sender: string,
  subject: string,
  bodyPlain: string,
  attachments: any[] = [],
  messageId?: string,
  references?: string
) {
  if (!userEmail) {
    console.error('User email data is null');
    return;
  }

  try {
    // Create a direct Supabase admin client
    const supabaseAdmin = createAdminClient();

    // Get user settings including time zone
    const { data: userSettings } = await supabaseAdmin
      .from('users')
      .select('timezone, custom_instructions, name')
      .eq('id', userEmail.user_id)
      .single();

    const userTimeZone = userSettings?.timezone || 'UTC';
    const now = new Date();
    const userDateTimeStringForDisplay = now.toLocaleString("en-US", { timeZone: userTimeZone });
    const userFirstName = userSettings?.name || "not known";

    // Process attachments and create message parts
    const messageParts = await processAttachments(attachments, bodyPlain, sender, subject);

    // Check if user has plus features
    const enableAdvancedFeatures = await isProUserAdmin(userEmail.user_id);

    // Create tools with user context
    const controller = new AbortController();
    const signal = controller.signal;

    const tools = createEmailTools(
      userEmail.user_id, 
      sender, 
      bodyPlain, 
      controller, 
      userTimeZone,
      enableAdvancedFeatures,
      messageId,
      references
    );

    // Extract and process Google Calendar event links if advanced features are enabled
    let eventSystemMessage = null;
    if (enableAdvancedFeatures) {
      try {
        // Optional logging of email body (limited for privacy)
        const bodyPreview = bodyPlain.length > 200 
          ? bodyPlain.substring(0, 100) + '...' + bodyPlain.substring(bodyPlain.length - 100) 
          : bodyPlain;
        console.log('Email body preview for link detection:', bodyPreview);
        
        // Find Google Calendar event links - use a more inclusive pattern
        const eventLinkRegex = /https:\/\/www\.google\.com\/calendar\/event\?eid=([a-zA-Z0-9_-]+)([^\s<>]*)/g;
        const eventLinks = [];
        let match;
        
        console.log('Searching for calendar links in email body');
        
        while ((match = eventLinkRegex.exec(bodyPlain)) !== null) {
          if (match[1]) {
            console.log(`Found calendar link match: ${match[0]}, extracted ID: ${match[1]}`);
            eventLinks.push(match[1]);
          }
        }
        
        console.log('Found calendar event links:', eventLinks);

        // If we found event links, process them
        if (eventLinks.length > 0) {
          const eventDetailsList = [];
          
          // Process each event link
          for (const encodedEventId of eventLinks) {
            try {
              console.log('Processing event ID:', encodedEventId);
              
              // Step 1: Convert from base64url to standard base64
              // Replace URL-safe chars with standard base64 chars
              let base64String = encodedEventId
                .replace(/-/g, '+')
                .replace(/_/g, '/');
                
              // Add padding if needed
              while (base64String.length % 4) {
                base64String += '=';
              }
              
              console.log('Standard base64:', base64String);
              
              // Step 2: Decode the base64 string to get the original data
              // This will contain both the event ID and calendar ID separated by a space
              try {
                // If we're running in Node.js environment
                const decoded = Buffer.from(base64String, 'base64').toString('utf-8');
                console.log('Decoded string:', decoded);
                
                // Step 3: Split the decoded string to get event ID and calendar ID
                const parts = decoded.split(' ');
                if (parts.length >= 2) {
                  const eventId = parts[0];
                  const calendarId = parts[1];
                  
                  console.log('Extracted event ID:', eventId);
                  console.log('Extracted calendar ID:', calendarId);

                  // Extract the recurring event ID from the event ID
                  const recurringEventId = eventId.split('_')[0];
                  console.log('Extracted recurring event ID:', recurringEventId);
                  
                  // Fetch event details using both the event ID and calendar ID
                  const eventResult = await getCalendarEvent(
                    userEmail.user_id,
                    recurringEventId,
                    calendarId, // Use the extracted calendar ID instead of 'primary'
                    userTimeZone
                  );
                  
                  console.log('Event fetch result:', 
                    eventResult.success ? 'Success' : 'Failed',  
                    eventResult.events ? `Found ${eventResult.events.length} events` : 'No events'
                  );
                  
                  if (eventResult.success && eventResult.events && eventResult.events.length > 0) {
                    eventDetailsList.push(eventResult.events[0]);
                  }

                  // console.log('Event details list:', eventDetailsList);
                } else {
                  console.warn('Could not split decoded string into event ID and calendar ID:', decoded);
                }
              } catch (decodeError) {
                console.error('Error decoding base64 string:', decodeError);
              }
            } catch (eventError) {
              console.warn(`Failed to process calendar event link: ${encodedEventId}`, eventError);
            }
          }
          
          // Construct event details system message if we found any valid events
          if (eventDetailsList.length > 0) {
            // Create markdown table of events
            let tableContent = 'Here are the events previously mentioned in the email thread:\n\n';
            tableContent += '| Event ID | Title | Start | End | Location |\n';
            tableContent += '|----------|-------|-------|-----|----------|\n';
            
            eventDetailsList.forEach(event => {
              const id = event.id || 'N/A';
              const title = event.summary || 'Untitled';
              const start = (event.start.includes('T') || event.start.includes('+') || event.start.includes('-')) && event.timeZone ? formatEventDate(event.start, event.timeZone) : event.start
              const end = (event.end.includes('T') || event.end.includes('+') || event.end.includes('-')) && event.timeZone ? formatEventDate(event.end, event.timeZone) : event.end
              const location = event.location || 'N/A';
              
              tableContent += `| ${id} | ${title} | ${start} | ${end} | ${location} |\n`;
            });
            
            // Add instructions about modifying events
            tableContent += '\nIn order to modify or delete one of the events listed above, pass the `eventId` of the event to the `modifyCalendarEvent` or `deleteCalendarEvent` tool.';
            
            eventSystemMessage = tableContent;
          }
        }
      } catch (linkProcessingError) {
        console.error('Error processing calendar links:', linkProcessingError);
      }
    }

    // Create a messages array with proper typing
    const messagesArray = [
      {
        role: "system" as const,
        content: generateEmailSystemPrompt({
          defaultTimeZone: userTimeZone,
          defaultTimeZoneDateAndTime: userDateTimeStringForDisplay, 
          userFirstName: userFirstName,
          rules: userSettings?.custom_instructions ||"",
          enableAdvancedCalendarFeatures: enableAdvancedFeatures
        })
      },
      {
        role: "user" as const,
        content: messageParts
      }
    ];

    // Add event system message if available
    if (eventSystemMessage) {
      messagesArray.push({
        role: "system" as const,
        content: eventSystemMessage
      });
    }

    // Process the email with AI
    await generateText({
      model: enableAdvancedFeatures ? openai('gpt-4.1-mini') : vertex("gemini-2.0-flash"),
      messages: messagesArray,
      tools: tools as ToolSet,
      maxSteps: 5,
      toolChoice: "required",
      abortSignal: signal,
      maxTokens: 4096,
      //@ts-ignore
      experimental_repairToolCall: repairToolCall,
    });

    if (signal.aborted) {
      console.info('Email processing completed with successful reply');
    } else {
      console.warn('Email processing completed with no reply');
    }

  } catch (error: any) {
    // Ignore AbortError as it's expected when processing completes successfully
    if (error.name !== 'AbortError') {
      console.error('Error in async email processing:', error);
    }
  }
}
