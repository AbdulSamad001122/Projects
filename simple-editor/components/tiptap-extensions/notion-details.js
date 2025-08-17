import { Node } from "@tiptap/core";
import { mergeAttributes } from "@tiptap/react";

export const NotionDetails = Node.create({
  name: "details",
  group: "block",
  content: "detailsSummary detailsContent",
  defining: true,
  parseHTML() { return [{ tag: "details" }]; },
  renderHTML({ HTMLAttributes }) { return ["details", mergeAttributes(HTMLAttributes), 0]; },
});

export const NotionDetailsSummary = Node.create({
  name: "detailsSummary",
  group: "block",
  content: "block+", // ✅ allows headings, paragraphs, lists
  parseHTML() { return [{ tag: "summary" }]; },
  renderHTML({ HTMLAttributes }) { return ["summary", mergeAttributes(HTMLAttributes), 0]; },
});

export const NotionDetailsContent = Node.create({
  name: "detailsContent",
  group: "block",
  content: "block+",
  parseHTML() { return [{ tag: "div" }]; },
  renderHTML({ HTMLAttributes }) { return ["div", mergeAttributes(HTMLAttributes), 0]; },
});
