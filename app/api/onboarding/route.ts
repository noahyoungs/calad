import { streamAIOnboarding } from "@/utils/ai-onboarding";
import { Message } from "ai";
import { createClient } from "@/utils/supabase/server";
import { z } from "zod";
import { fetchUserCalendars, GoogleCalendarListItem } from "@/utils/fetch-google-calendars";
import { OnboardingQuestion } from "@/utils/ai-onboarding";
import { completeOnboarding } from "@/actions/actions";
import { timeZoneSchemaEnum } from "@/utils/timeZoneUtils";
import { updateSelectedCalendar } from "@/actions/settings-actions";
import namer from 'color-namer';
import { addUserEmails } from "@/actions/email-actions";
import { vertex as provider } from "@/utils/ai-config";

export const maxDuration = 60; 

export async function POST(req: Request) {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  console.debug("User:", user);

  // Get the user's email from supabase auth
  const { email } = user;
  const fullName = user.user_metadata?.full_name;
  const firstName = fullName?.split(" ")[0];
  

  // Get the user's name from supabase auth
  try {
    // Parse the incoming request to get messages
    const { messages, localTimeZone } = await req.json();
    
    // Fetch the user's Google calendars using our utility function
    const { calendars: userCalendars, error: calendarError } = await fetchUserCalendars(user.id);
    
    if (calendarError) {
      console.log("Error fetching calendars:", calendarError);
    } else {
      console.log(`Successfully fetched ${userCalendars.length} calendars for the user`);
    }

    const calendarQuestion = {
      id: "calendar",
      description: "The id of the calendar the user wants to use. Currently you can only work with a single calendar. Here are the calendars available to the user:\n" + userCalendars.map(calendar => {
        const colorName = namer(calendar.backgroundColor).basic[0].name;
        return `Summary: ${calendar.summary} ID: ${calendar.id} Color: ${colorName} (${calendar.backgroundColor}) Primary: ${calendar.primary ? "Yes" : "No"}`;
      }).join("\n") + "\n\n" + "Please ask the user which calendar they want to use in a conversational manner Don't show the user id to the user because its not human readable. However, when you select the calendar, you need to use the id.",
      schema: z.enum(userCalendars.map(calendar => calendar.id) as [string, ...string[]]),
    }
    
    // Define onboarding questions, each with its own tool for validation and saving
    const questions: OnboardingQuestion[] = [
      {
        id: "name",
        description: `Casual name for you to refer to the user. The user's name according to google oauth is ${firstName}, but you should confirm it with the user.`,
        schema: z.string().min(1, "Name must be at least 1 characters long").max(50, "Name cannot exceed 50 characters"),
      },
      {
        id: "timezone",
        description: `The time zone the user wants to use for events by default, when they don't specify otherwise. In the future, if the user asks you to create an event but doesn't specify a time zone, you will use this time zone. This time zone needs to be entered in IANA format, but the user likely won't be familiar with this format. Just ask the user what time zone they want, and they will likely give you an answer like 'Pacific Time' or a location like 'San Francisco'. In this case, convert their answer to IANA format using your knowledge of the world. The user's browers local time zone is ${localTimeZone}, so first ask them if they want to use this time zone or a different one.`,
        schema: timeZoneSchemaEnum,
      },
      {
        id: "emails",
        description: `As an AI agent, you'll be able to communicate with the user using email, as long as they are using a verified email address. Ask the user for a list of one or more email addresses to register. Once you save the email addresses, they'll recieve an email with a link to verify their email address. Once they verify their email address, they can send you messages via email. This is entirely optional, the user can skip this step if they don't want to use email. The user's email address according to google is ${email}, ask them if they want to include this email or any other emails. If you try to save an email address that's already registered to a user, you'll get an error '`,
        schema: z.string().optional().describe("A list of email addresses to register, separated by commas"),
      }
    ];

    // only add the calendar question if the user has more than one calendar
    if (userCalendars.length > 1) {
      questions.push(calendarQuestion);
    }

    // Validate that all schemas are properly defined
    for (const question of questions) {
      if (!question.schema) {
        throw new Error(`Question ${question.id} is missing a schema`);
      }
    }

    // Additional instructions for the AI
    const backgroundPrompt = `
You are cal.ad, an AI assistant that helps users create and manage events in their calendar.
You're main purpose is to recieve messages with event details from the user and create events in their calendar.
However, you can't do that yet because the user is in the onboarding process and needs to provide some information first.
You need to take down information from the user so that you can serve them better. Once the onboarding process is complete, you will be able to create events in the user's calendar.
Fyi, the user can change any of the information you collect at any time in the settings page.

Be friendly and conversational. Start by introducing yourself as cal.ad.
Explain that you need to collect a few pieces of information to personalize the user's experience.
Use markdown (gfm) formatting, particularly headings and bold, as well as emojis to make the conversation more engaging.

**Brand Voice Guidelines for cal.ad**

Use a tone that is warm, clear, and concise. Be helpful and friendly, like a trusted assistant who’s easy to talk to. Use natural, human-like phrasing, and avoid sounding overly formal or robotic. Emojis are welcome where they add clarity or friendliness.

- **Write with**: warmth, empathy, and clarity  
- **Keep it**: brief but personable  
- **Be**: proactive and reassuring  
- **Avoid**: jargon, stiff language, or corporate tone  

**Example phrases**:
- "Just added that to your calendar ✅"
- "Let me know if you'd like to tweak anything!"
- "Looks like I need a bit more info—could you clarify the date or time?"
`;

    // Prepare information about the user (firstName, email, userCalendars) available at the comment position
    // The userCalendars list is now available here with calendar information

    // Stream the onboarding AI response
    return await streamAIOnboarding({
      model: provider("gemini-2.0-flash-001"),
      questions,
      messages,
      backgroundPrompt,
      onError: (error) => {
        console.error("Onboarding API Error:", error);
        if (error instanceof Error) {
          console.error("Stack trace:", error.stack);
        }
      },
      onComplete: async () => {
        console.log("Server: Onboarding complete");
        try {
          // Use the dedicated function to mark onboarding as complete
          const result = await completeOnboarding();
          if (!result.success) {
            console.error("Failed to complete onboarding:", result.error);
          }
        } catch (error) {
          console.error("Error in onComplete:", error);
        }
      },
      onSave: async (action) => {
        console.log("Server: Saving answer for question:", action.questionId, action.parsedAnswer);
        
        try {
          // Handle each question type based on the questionId
          switch (action.questionId) {
            case "name":
              // Save the user's name
              const { error: nameError } = await supabase
                .from("users")
                .update({
                  name: action.parsedAnswer,
                  updated_at: new Date().toISOString()
                })
                .eq("id", user.id);
              
              if (nameError) {
                console.error("Error saving user name:", nameError);
                throw new Error(`Failed to save name: ${nameError.message}`);
              }
              break;
              
            case "timezone":
              // Save the user's timezone
              const { error: timezoneError } = await supabase
                .from("users")
                .update({
                  timezone: action.parsedAnswer,
                  updated_at: new Date().toISOString()
                })
                .eq("id", user.id);
              
              if (timezoneError) {
                console.error("Error saving user timezone:", timezoneError);
                throw new Error(`Failed to save timezone: ${timezoneError.message}`);
              }
              break;
            
            case "rules":
              // Save the user's custom instructions/rules
              if (action.parsedAnswer) { // Only save if the user provided rules (optional)
                const { error: rulesError } = await supabase
                  .from("users")
                  .update({
                    custom_instructions: action.parsedAnswer,
                    updated_at: new Date().toISOString()
                  })
                  .eq("id", user.id);
                
                if (rulesError) {
                  console.error("Error saving user rules:", rulesError);
                  throw new Error(`Failed to save rules: ${rulesError.message}`);
                }
              }
              break;
            
            case "emails":
              // Save the user's email addresses (optional)
              if (action.parsedAnswer) {
                const result = await addUserEmails(user.id, action.parsedAnswer, firstName);
                if (!result.success) {
                  throw new Error(result.error || "Failed to add emails");
                }
              }
              break;
            
            case "calendar":
              // Save the selected calendar
              if (action.parsedAnswer) {
                const formData = new FormData();
                formData.append("calendarId", action.parsedAnswer);
                
                const result = await updateSelectedCalendar(formData);
                if (!result.success) {
                  throw new Error(result.error || "Failed to update calendar");
                }
              }
              break;
              
            default:
              console.warn(`Unhandled question ID: ${action.questionId}`);
          }
        } catch (error) {
          console.error(`Error saving answer for ${action.questionId}:`, error);
          throw error; // Rethrow to allow the AI to respond with an error
        }
      }
    });

  } catch (error) {
    console.error("Error in onboarding API:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
