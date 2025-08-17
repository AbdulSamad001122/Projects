"use client";
import { Button } from "@/components/tiptap-ui-primitive/button";
import { useCurrentEditor } from "@tiptap/react"; // ✅ Import added

export function DetailsButton() {
  const { editor } = useCurrentEditor();
  if (!editor) return null;

  const insertDetails = () => {
    editor.chain().focus().insertContent({
      type: "details",
      content: [
        {
          type: "detailsSummary",
          content: [
            { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Toggle Title" }] },
          ],
        },
        {
          type: "detailsContent",
          content: [
            { type: "paragraph", content: [{ type: "text", text: "Hidden content here." }] },
          ],
        },
      ],
    }).run();
  };

  return <Button onClick={insertDetails} data-active={false}>Details</Button>;
}
