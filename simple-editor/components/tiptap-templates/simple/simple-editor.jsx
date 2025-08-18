"use client";
import axios from "axios";
import debounce from "lodash.debounce"; // ✅ add this
import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useCurrentEditor } from "@tiptap/react";
import { MessageSquarePlusIcon } from "lucide-react";

import {
  useLiveblocksExtension,
  FloatingToolbar,
} from "@liveblocks/react-tiptap";

import {
  NotionDetails,
  NotionDetailsSummary,
  NotionDetailsContent,
} from "@/components/tiptap-extensions/notion-details";
import Placeholder from "@tiptap/extension-placeholder"; // <- Add this

import { DetailsButton } from "@/components/tiptap-ui/details-button";

import * as React from "react";
import { EditorContent, EditorContext, useEditor } from "@tiptap/react";

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { TextAlign } from "@tiptap/extension-text-align";
import { Typography } from "@tiptap/extension-typography";
import { Highlight } from "@tiptap/extension-highlight";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { Selection } from "@tiptap/extensions";

// --- UI Primitives ---
import { Button } from "@/components/tiptap-ui-primitive/button";
import { Spacer } from "@/components/tiptap-ui-primitive/spacer";
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar";

// --- Tiptap Node ---
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension";
import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension";
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss";
import "@/components/tiptap-node/code-block-node/code-block-node.scss";
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss";
import "@/components/tiptap-node/list-node/list-node.scss";
import "@/components/tiptap-node/image-node/image-node.scss";
import "@/components/tiptap-node/heading-node/heading-node.scss";
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss";

// --- Tiptap UI ---
import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu";
import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button";
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu";
import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button";
import { CodeBlockButton } from "@/components/tiptap-ui/code-block-button";
import {
  ColorHighlightPopover,
  ColorHighlightPopoverContent,
  ColorHighlightPopoverButton,
} from "@/components/tiptap-ui/color-highlight-popover";
import {
  LinkPopover,
  LinkContent,
  LinkButton,
} from "@/components/tiptap-ui/link-popover";
import { MarkButton } from "@/components/tiptap-ui/mark-button";
import { TextAlignButton } from "@/components/tiptap-ui/text-align-button";
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button";

// --- Icons ---
import { ArrowLeftIcon } from "@/components/tiptap-icons/arrow-left-icon";
import { HighlighterIcon } from "@/components/tiptap-icons/highlighter-icon";
import { LinkIcon } from "@/components/tiptap-icons/link-icon";

// --- Hooks ---
import { useIsMobile } from "@/hooks/use-mobile";
import { useWindowSize } from "@/hooks/use-window-size";
import { useCursorVisibility } from "@/hooks/use-cursor-visibility";

// --- Components ---
import { ThemeToggle } from "@/components/tiptap-templates/simple/theme-toggle";

// --- Lib ---
import { handleImageUpload, MAX_FILE_SIZE } from "@/lib/tiptap-utils";

// --- Styles ---
import "@/components/tiptap-templates/simple/simple-editor.scss";

import content from "@/components/tiptap-templates/simple/data/content.json";
import { Threads } from "@/app/documents/[documentId]/Threads";

const MainToolbarContent = ({ onHighlighterClick, onLinkClick, isMobile }) => {
  const { editor } = useCurrentEditor();

  if (!editor) return null;

  return (
    <>
      <Spacer />
      <ToolbarGroup>
        <UndoRedoButton action="undo" />
        <UndoRedoButton action="redo" />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <HeadingDropdownMenu levels={[1, 2, 3, 4]} portal={isMobile} />
        <ListDropdownMenu
          types={["bulletList", "orderedList", "taskList"]}
          portal={isMobile}
        />
        <BlockquoteButton />
        <CodeBlockButton />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <MarkButton type="bold" />
        <MarkButton type="italic" />
        <MarkButton type="strike" />
        <MarkButton type="code" />
        <MarkButton type="underline" />
        {!isMobile ? (
          <ColorHighlightPopover />
        ) : (
          <ColorHighlightPopoverButton onClick={onHighlighterClick} />
        )}
        {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <MarkButton type="superscript" />
        <MarkButton type="subscript" />
      </ToolbarGroup>
      <ToolbarGroup>
        <DetailsButton />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <TextAlignButton align="left" />
        <TextAlignButton align="center" />
        <TextAlignButton align="right" />
        <TextAlignButton align="justify" />
      </ToolbarGroup>
      <ToolbarGroup>
        <Button
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          disabled={!editor.can().chain().focus().setHorizontalRule().run()}
          data-active={false}
          className="bg-transparent hover:bg-gray-100"
        >
          ──
        </Button>
      </ToolbarGroup>
      {/* 🆕 Comment Button */}
      <ToolbarGroup>
        <Button
          onClick={() => editor?.chain().focus().addPendingComment().run()}
          disabled={!editor?.isEditable}
          data-active={editor?.isActive("liveblocksCommentMark")}
          className="bg-transparent hover:bg-gray-100"
        >
          <MessageSquarePlusIcon className="tiptap-button-icon" />
        </Button>
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup>
        <ImageUploadButton text="Add" />
      </ToolbarGroup>

      <Spacer />
      {isMobile && <ToolbarSeparator />}
      <ToolbarGroup>
        <ThemeToggle />
      </ToolbarGroup>
    </>
  );
};

const MobileToolbarContent = ({ type, onBack }) => (
  <>
    <ToolbarGroup>
      <Button data-style="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        {type === "highlighter" ? (
          <HighlighterIcon className="tiptap-button-icon" />
        ) : (
          <LinkIcon className="tiptap-button-icon" />
        )}
      </Button>
    </ToolbarGroup>

    <ToolbarSeparator />

    {type === "highlighter" ? (
      <ColorHighlightPopoverContent />
    ) : (
      <LinkContent />
    )}
  </>
);

export function SimpleEditor() {
  const liveblocks = useLiveblocksExtension();
  const params = useParams();
  const documentId = params?.documentId;

  const isMobile = useIsMobile();
  const { height } = useWindowSize();
  const [mobileView, setMobileView] = React.useState("main");
  const toolbarRef = React.useRef(null);

  // --- AutoSave function (debounced)
  const handleAutoSave = React.useMemo(
    () =>
      debounce(async (editor) => {
        if (!editor) return;
        const html = editor.getHTML();
        const json = editor.getJSON();

        try {
          await axios.post("/api/saveDoc", { documentId, html, json });
          console.log("✅ Auto-saved");
        } catch (err) {
          console.error("❌ Auto-save failed:", err);
        }
      }, 1000), // wait 1s after typing stops
    [documentId]
  );

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": "Main content area, start typing to enter text.",
        class: "simple-editor",
      },
    },
    extensions: [
      StarterKit.configure({
        horizontalRule: true,
        link: {
          openOnClick: false,
          enableClickSelection: true,
        },
      }),
      liveblocks,
      HorizontalRule,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Image,
      Typography,
      Superscript,
      Subscript,
      Selection,
      ImageUploadNode.configure({
        accept: "image/*",
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: handleImageUpload,
        onError: (error) => console.error("Upload failed:", error),
      }),

      NotionDetails,
      NotionDetailsSummary,
      NotionDetailsContent,
      Placeholder.configure({
        includeChildren: true,
        placeholder: ({ node }) =>
          node.type.name === "detailsSummary" ? "Summary here…" : null,
      }),
    ],
    content: "",
    onUpdate: ({ editor }) => {
      handleAutoSave(editor); // ✅ AutoSave runs here
    },
  });

  // --- Load document from DB
  React.useEffect(() => {
    if (!editor || !documentId) return;

    const fetchDocContent = async () => {
      try {
        const res = await axios.post("/api/showEachDoc", { documentId });

        if (res.data?.docsContent?.content) {
          const storage = editor.storage.liveblocks; // 👈 comes from useLiveblocksExtension
          if (!storage || storage.isHydrated) return;

          // only hydrate if liveblocks has no content yet
          storage.update(() => {
            editor.commands.setContent(res.data.docsContent.content);
          });
        }
      } catch (err) {
        console.error("Failed to load document:", err);
      }
    };

    fetchDocContent();
  }, [editor, documentId]);

  const rect = useCursorVisibility({
    editor,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  });

  React.useEffect(() => {
    if (!isMobile && mobileView !== "main") {
      setMobileView("main");
    }
  }, [isMobile, mobileView]);

  // --- Manual Save button (still available if needed)
  const handleSave = async () => {
    if (!editor) return;

    const html = editor.getHTML();
    const json = editor.getJSON();

    try {
      const result = await axios.post("/api/saveDoc", {
        documentId,
        html,
        json,
      });

      console.log("Saved:", result.data);
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  return (
    <div className="simple-editor-wrapper">
      <EditorContext.Provider value={{ editor }}>
        <Toolbar
          ref={toolbarRef}
          style={{
            ...(isMobile
              ? { bottom: `calc(100% - ${height - rect.y}px)` }
              : {}),
          }}
        >
          {mobileView === "main" ? (
            <MainToolbarContent
              onHighlighterClick={() => setMobileView("highlighter")}
              onLinkClick={() => setMobileView("link")}
              isMobile={isMobile}
            />
          ) : (
            <MobileToolbarContent
              type={mobileView === "highlighter" ? "highlighter" : "link"}
              onBack={() => setMobileView("main")}
            />
          )}
        </Toolbar>

        <EditorContent
          editor={editor}
          role="presentation"
          className="simple-editor-content"
        />
        <Threads editor={editor} />

        {/* Keep Save button just in case */}
        {/* <button onClick={handleSave}>Save</button> */}
      </EditorContext.Provider>
    </div>
  );
}
