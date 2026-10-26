import { z } from 'zod';
import { openai } from '@/utils/ai-config'; // Assuming ai-config is in utils
import { generateText, generateObject, NoSuchToolError, type Tool } from 'ai';
import { timeZoneSchemaEnum } from './timeZoneUtils'; // Assuming it's in the same utils folder

// Define LanguageModelV1FunctionToolCall locally as it's not directly exported by 'ai' for import
interface LanguageModelV1FunctionToolCall {
  toolCallId: string;
  toolName: string;
  args: string; // stringified JSON
}

type ToolParameters = z.ZodSchema<any>;
// Correctly define AppTool using the generic Tool type from 'ai'
// Assumes Tool from 'ai' is: export type Tool<PARAMETERS extends ZodTypeAny, RESULT = any>
type AppTool = Tool<ToolParameters, any>;
type AppTools = Record<string, AppTool>;

// Helper function to unwrap Zod schemas and access the underlying ZodObject
function getUnderlyingObjectSchema(schema: z.ZodTypeAny): z.AnyZodObject | null {
  if (schema instanceof z.ZodObject) {
    return schema;
  }
  // Check _def for common wrapper patterns
  if (schema._def) {
    const def = schema._def as any; // Use any for broader compatibility with Zod internal structures
    if (def.schema && def.schema instanceof z.ZodType) { // e.g., ZodEffects
      return getUnderlyingObjectSchema(def.schema);
    }
    if (def.innerType && def.innerType instanceof z.ZodType) { // e.g., ZodOptional, ZodNullable, ZodDefault
      return getUnderlyingObjectSchema(def.innerType);
    }
    if (def.type && def.type instanceof z.ZodType) { // e.g., ZodBranded
        return getUnderlyingObjectSchema(def.type);
    }
  }
  return null; // Not an object or a recognized wrapper of an object
}

// Helper function to unwrap Zod schemas and access the underlying ZodEnum
function getUnderlyingEnumSchema(schema: z.ZodTypeAny): z.ZodEnum<[string, ...string[]]> | null {
  if (schema instanceof z.ZodEnum) {
    return schema;
  }
  // Check _def for common wrapper patterns
  if (schema._def) {
    const def = schema._def as any; // Use any for broader compatibility with Zod internal structures
    if (def.schema && def.schema instanceof z.ZodType) { // e.g., ZodEffects
      return getUnderlyingEnumSchema(def.schema);
    }
    if (def.innerType && def.innerType instanceof z.ZodType) { // e.g., ZodOptional, ZodNullable, ZodDefault
      return getUnderlyingEnumSchema(def.innerType);
    }
    if (def.type && def.type instanceof z.ZodType) { // e.g., ZodBranded
        return getUnderlyingEnumSchema(def.type);
    }
  }
  return null; // Not a ZodEnum or a recognized wrapper of a ZodEnum
}

export const repairToolCall = async ({
  toolCall,
  tools,
  parameterSchema,
  error,
}: {
  toolCall: LanguageModelV1FunctionToolCall;
  tools: AppTools;
  parameterSchema: (toolCall: LanguageModelV1FunctionToolCall) => z.ZodSchema<any>; 
  error: any;
}): Promise<LanguageModelV1FunctionToolCall | null> => {
  console.debug("Attempting to repair tool call:", toolCall.toolName, "Args:", toolCall.args, "Error:", error);

  if (NoSuchToolError.isInstance(error)) {
    console.warn("Repair skipped: Tool does not exist.");
    return null;
  }

  const tool = tools[toolCall.toolName as keyof AppTools];
  if (!tool || !tool.parameters) {
    console.warn("Repair skipped: Tool or parameters schema not found.");
    return null;
  }

  let originalArgs: any;
  try {
    if (typeof toolCall.args === 'string') {
      originalArgs = JSON.parse(toolCall.args);
    } else {
      originalArgs = toolCall.args; 
    }
  } catch (e) {
    console.error("Repair failed: Could not parse original tool arguments.", e);
    return null;
  }

  let zodIssues: z.ZodIssue[] = [];
  if (error && typeof error === 'object') {
    if ('issues' in error && Array.isArray((error as any).issues)) {
      zodIssues = (error as any).issues;
    } else if ('cause' in error && typeof (error as any).cause === 'object' && (error as any).cause) {
      const cause = (error as any).cause;
      if (cause instanceof z.ZodError) {
        zodIssues = cause.issues;
      } else if ('issues' in cause && Array.isArray((cause as any).issues)) {
        zodIssues = (cause as any).issues;
      }
    }
  }

  if (zodIssues.length === 0) {
    const validationResult = tool.parameters.safeParse(originalArgs);
    if (!validationResult.success) {
      zodIssues = validationResult.error.issues;
    } else {
      console.warn("Repair skipped: Args seem valid by schema, but repair was triggered. Error:", error);
      return null;
    }
  }

  if (zodIssues.length === 0) {
    console.warn("Repair skipped: No specific Zod issues found to repair.");
    return null;
  }

  const repairPromises: Promise<{ fieldName: string; repairedValue: any }>[] = [];

  for (const issue of zodIssues) {
    if (issue.path.length === 0) continue;
    const fieldName = issue.path[0] as string;
    const badValue = originalArgs[fieldName];
    
    const baseSchemaForShape = getUnderlyingObjectSchema(tool.parameters);

    if (!baseSchemaForShape) {
      console.warn(`Repair skipped for field "${fieldName}" of tool "${toolCall.toolName}": The tool's parameters schema is not a ZodObject or a recognized wrapped ZodObject. Path: ${issue.path.join('.')}`);
      continue;
    }

    const fieldSchema = baseSchemaForShape.shape?.[fieldName];

    if (!fieldSchema) {
      console.warn(`Repair skipped for field "${fieldName}" of tool "${toolCall.toolName}": Schema not found in tool parameters shape. Path: ${issue.path.join('.')}`);
      continue;
    }

    const underlyingEnumSchema = getUnderlyingEnumSchema(fieldSchema);

    if (fieldName.toLowerCase().includes('timezone') && underlyingEnumSchema) {
      const prompt = `The timezone field '${fieldName}' for tool '${toolCall.toolName}' received an invalid value: '${JSON.stringify(badValue)}'. ` +
                     `Please select the correct IANA timezone string from the available options that best matches the invalid input. ` +
                     `Respond with ONLY the single, corrected IANA timezone string chosen from its schema.`;
      const timezoneRepairSchema = z.object({ repairedTimezone: underlyingEnumSchema });
      repairPromises.push(
        generateObject({
          model: openai('gpt-4.1-mini', { structuredOutputs: true }),
          schema: timezoneRepairSchema,
          prompt,
        }).then(result => ({ fieldName, repairedValue: (result.object as any).repairedTimezone as string }))
      );
    } else {
      console.debug(`Attempting non-timezone repair for field: "${fieldName}", tool: "${toolCall.toolName}", schema definition:`, JSON.stringify(fieldSchema._def));
      const singleFieldRepairSchema = z.object({ _repair_target_: fieldSchema });
      const prompt = `The field '${fieldName}' for tool '${toolCall.toolName}' received an invalid value: ${JSON.stringify(badValue)}. ` +
                     `The expected structure for this field is described by its schema. ` +
                     `Please provide a corrected value for this field to fit the schema: ${JSON.stringify(fieldSchema.describe())}`;
      repairPromises.push(
        generateObject({
          model: openai('gpt-4.1-mini', { structuredOutputs: true }),
          schema: singleFieldRepairSchema,
          prompt,
        }).then(result => ({
          fieldName,
          repairedValue: (result.object as any)._repair_target_,
        }))
      );
    }
  }

  if (repairPromises.length === 0) {
    console.warn("Repair: No repair operations were generated for the identified issues.");
    return null;
  }
  
  const settledResults = await Promise.allSettled(repairPromises);
  
  let allRepairsSucceeded = true;
  const repairedArgs = { ...originalArgs };

  for (const result of settledResults) {
    if (result.status === 'fulfilled') {
      repairedArgs[result.value.fieldName] = result.value.repairedValue;
    } else {
      allRepairsSucceeded = false;
      console.error(`Repair failed for field. Reason:`, result.reason);
      break; 
    }
  }

  if (!allRepairsSucceeded) {
    console.warn("Tool call repair failed: One or more sub-repairs did not succeed.");
    return null;
  }
  
  console.debug("Tool call successfully repaired. New args:", repairedArgs);
  return { 
    toolCallId: toolCall.toolCallId,
    toolName: toolCall.toolName,
    args: JSON.stringify(repairedArgs) 
  };
}; 