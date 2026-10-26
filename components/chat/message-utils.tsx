import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MarkdownItem, ToolInvocation } from "./types";

/**
 * Creates markdown components from text content
 */
export const createMarkdownComponents = (content: string | null | undefined): MarkdownItem[] => {
  if (!content) return [];
  
  return [{
    type: 'text',
    component: (
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {typeof content === "string" ? content : ""}
      </ReactMarkdown>
    )
  }];
};

/**
 * Creates markdown components from message parts
 */
export const createMarkdownComponentsFromParts = (parts: any[]): MarkdownItem[] => {
  if (!parts?.length) return [];

  return parts.map((part, index) => {
    if (part.type === "text") {
      const safeText = typeof part.text === "string" ? part.text : "";
      return {
        type: 'text',
        component: (
          <ReactMarkdown key={`text-${index}`} remarkPlugins={[remarkGfm]}>
            {safeText}
          </ReactMarkdown>
        )
      };
    }
    return {
      type: part.type,
      toolInvocation: part.type === 'tool-invocation' ? part.toolInvocation : null
    };
  });
};

/**
 * Determines whether to render a message based on its parts
 */
export const shouldRenderMessage = (parts: any[] | undefined, content: string | null | undefined): boolean => {
  // If no parts exist but content does, render the message
  if (!parts?.length) return !!content;
  
  // Check if any part should be rendered
  return parts.some(part => {
    if (part.type === 'text') {
      return true;
    }
    if (part.type === 'tool-invocation') {
      const toolInvocation = part.toolInvocation as ToolInvocation;
      const { state, result } = toolInvocation;
      
      // Don't render cancelled or aborted tool calls
      if (['cancelled', 'aborted'].includes(state)) {
        return false;
      }
      
      // Don't render tool calls with aborted results
      if (state === 'result' && result?.status === 'aborted') {
        return false;
      }
      
      return true;
    }
    return false;
  });
};

/**
 * Renders a text part of the message
 */
export const renderTextPart = (markdownItem: MarkdownItem, index: number) => {
  return (
    <div
      key={`text-${index}`}
      className="prose dark:prose-invert max-w-full overflow-x-auto text-pretty"
    >
      {markdownItem.component}
    </div>
  );
}; 