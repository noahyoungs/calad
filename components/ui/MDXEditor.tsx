'use client';

import dynamic from 'next/dynamic';
import { forwardRef } from 'react';
import { type MDXEditorMethods, type MDXEditorProps } from '@mdxeditor/editor';
import { cn } from '@heroui/react';

// This is the only place InitializedMDXEditor is imported directly
const EditorComp = dynamic(() => import('./InitializedMDXEditor'), {
  // Make sure we turn SSR off
  ssr: false
});

// Define MDXEditor props interface
interface CustomMDXEditorProps {
  markdown: string;
  onChange?: (markdown: string) => void;
  className?: string;
}

// This is what is imported by other components. Pre-initialized with plugins, and ready
// to accept other props, including a ref.
export const MDXEditor = forwardRef<MDXEditorMethods, CustomMDXEditorProps>(
  ({ className, ...props }, ref) => (
    <div className={cn('mdx-editor-wrapper prose', className)}>
      <EditorComp 
        {...props} 
        editorRef={ref} 
        contentEditableClassName="!text-foreground"
      />
    </div>
  )
);

// TS complains without the following line
MDXEditor.displayName = 'MDXEditor'; 