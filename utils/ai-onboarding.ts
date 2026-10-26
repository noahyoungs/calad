import {
  Message,
  streamText,
  LanguageModelV1,
  StreamTextOnFinishCallback,
  StreamTextOnStepFinishCallback,
} from "ai";
import { z } from "zod";
import { generateId } from "@/utils/id-generator";

export interface OnboardingQuestion {
  id: string;
  description: string;
  schema: z.ZodTypeAny;
}

export interface SaveAction {
  questionId: string;
  parsedAnswer: any;
}

export interface AIOnboardingServerConfig {
  model: LanguageModelV1;
  messages: Message[];
  onError?: (event: { error: unknown }) => void;
  onFinish?: StreamTextOnFinishCallback<Record<string, any>>;
  onStepFinish?: StreamTextOnStepFinishCallback<Record<string, any>>;
  maxSteps?: number;
  questions: OnboardingQuestion[];
  backgroundPrompt?: string;
  onComplete?: (() => void) | (() => Promise<void>);
  onSave?:
    | ((action: SaveAction) => void)
    | ((action: SaveAction) => Promise<void>);
}

/**
 * Server-side function to stream AI responses during onboarding
 */
export async function streamAIOnboarding({
  model,
  messages,
  questions,
  backgroundPrompt = "You are an onboarding assistant helping a user set up their account.",
  onError = (event: { error: unknown }) => {
    console.error("AI Onboarding Error:", event.error);
  },
  onFinish,
  onStepFinish,
  maxSteps = 10,
  onComplete,
  onSave,
}: AIOnboardingServerConfig): Promise<Response> {

const controller = new AbortController();
const signal = controller.signal;
  // Create system message with instructions
  const systemPrompt = `
${backgroundPrompt}

Ask the user the following questions one by one, waiting for their response before proceeding to the next question.

Ask one question at a time. Do not show the next question until the user has answered the current one.
When the user answers a question, use the specific tool for that question to validate and save the answer.

After all questions have been answered successfully, use the complete_onboarding tool to mark the process as complete.
Then thank the user and let them know they can proceed.

Questions to ask:
${questions.map((q) => `Question: ${q.id}\nDescription: ${q.description}`).join("\n\n")}
`;

  // Prepare system message with required id
  const systemMessage: Message = {
    role: "system",
    content: systemPrompt,
    id: generateId(),
  };

  // Create tools configuration - one for each question
  const tools: Record<string, any> = {
    // Add completion tool
    complete_onboarding: {
      description:
        "Mark the onboarding process as complete after all questions have been answered successfully",
      parameters: z.object({}),
      execute: async () => {
        try {
          if (onComplete) {
            await Promise.resolve(onComplete());
            return {
              success: true,
              message: "Onboarding completed successfully",
            };
          }
        } catch (error) {
          console.error("Error completing onboarding:", error);
          return {
            success: false,
            error: `Error completing onboarding: ${error instanceof Error ? error.message : String(error)}`,
          };
        } finally {
          controller.abort();
        }
      },
    },
  };

  // Add a tool definition for each question
  for (const question of questions) {
    const toolName = `save_${question.id}`;

    // Create tool definition with parameters from the question's schema
    const toolDef: any = {
      description: `Save the answer for the "${question.id}" question`,
      parameters: z.object({
        answer: z.string().describe(`The user's answer to the question: ${question.description}`),
      }),
    };

    // Add execute function for server-side saves
    if (onSave) {
      toolDef.execute = async ({ answer }: { answer: string }) => {
        try {
          // Parse and validate the answer using the question's schema
          let parsedAnswer;
          try {
            parsedAnswer = question.schema.parse(answer);
          } catch (error) {
            if (error instanceof z.ZodError) {
              return {
                success: false,
                error: `Validation error: ${error.errors.map((e) => e.message).join(", ")}`,
                validationErrors: error.errors,
              };
            }
            throw error;
          }

          // Save the answer
          await Promise.resolve(onSave({ questionId: question.id, parsedAnswer }));
          return {
            success: true,
            message: `Answer for "${question.id}" saved successfully`,
          };
        } catch (error) {
          console.error(`Error in ${toolName}:`, error);
          return {
            success: false,
            error: `Error processing answer: ${error instanceof Error ? error.message : String(error)}`
          };
        }
      };
    }

    tools[toolName] = toolDef;
  }

  // console.debug("Tools:", JSON.stringify(tools, null, 2));
  // Stream the AI response

  try {
    const result = streamText({
      model,
      messages: [systemMessage, ...messages],
      tools,
      onError,
      onFinish,
      onStepFinish,
      maxSteps,
      abortSignal: signal
    });
  
    return result.toDataStreamResponse();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.info('Onboarding aborted');
    } else {
      console.error('Onboarding error:', error);
    }
    throw error;
  }
  
}
