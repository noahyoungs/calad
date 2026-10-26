'use client';

import { ForwardedRef } from 'react';
import {
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  linkPlugin,
  linkDialogPlugin,
  codeBlockPlugin,
  markdownShortcutPlugin,
  MDXEditor,
  type MDXEditorMethods,
  type MDXEditorProps,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  CreateLink,
  InsertCodeBlock,
  ListsToggle,
  InsertThematicBreak,
  CodeToggle,
  Separator,
  diffSourcePlugin,
  DiffSourceToggleWrapper
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';
import './mdx-editor-styles.css';

// Only import this to the next file
export default function InitializedMDXEditor({
  editorRef,
  ...props
}: { editorRef: ForwardedRef<MDXEditorMethods> | null } & MDXEditorProps) {
  return (
    <MDXEditor
      plugins={[
        // Core plugins
        headingsPlugin(),
        listsPlugin(),
        quotePlugin(),
        thematicBreakPlugin(),
        linkPlugin(),
        linkDialogPlugin(),
        codeBlockPlugin(),
        markdownShortcutPlugin(),
        // Add diff source plugin
        diffSourcePlugin({
          viewMode: 'rich-text'
        }),
        // Add toolbar plugin
        toolbarPlugin({
          toolbarContents: () => (
            <DiffSourceToggleWrapper
              options={['rich-text', 'source']}
            >
              <UndoRedo />
              <Separator />
              <BlockTypeSelect />
              <BoldItalicUnderlineToggles />
              <CodeToggle />
              <ListsToggle
                options={['number', 'bullet']}
               />
              <InsertCodeBlock />
              <InsertThematicBreak />
            </DiffSourceToggleWrapper>
          )
        })
      ]}
      {...props}
      ref={editorRef}
    />
  );
} 