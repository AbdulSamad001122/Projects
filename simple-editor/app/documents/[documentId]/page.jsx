"use client";

import React, { useEffect, useState } from "react";
import { SimpleEditor } from "../../../components/tiptap-templates/simple/simple-editor";
import { useParams } from "next/navigation";
import axios from "axios";

const DocumentIdPage = () => {
  // const params = useParams();
  // const documentId = params?.documentId;

  // const [content, setContent] = useState(null);

  // // First useEffect → Saving doc
  // useEffect(() => {
  //   if (!documentId) return;

  //   const saveDocument = async () => {
  //     try {
  //       const saveResult = await axios.post("/api/saveDoc", { documentId });
  //       console.log("SaveDoc response:", saveResult.data);
  //     } catch (error) {
  //       console.error("Error while saving document id:", error);
  //     }
  //   };

  //   saveDocument();
  // }, [documentId]);

  // // Second useEffect → Fetching doc content
  // useEffect(() => {
  //   if (!documentId) return;

  //   const fetchDocument = async () => {
  //     try {
  //       const showResult = await axios.post("/api/showEachDoc", { documentId });
  //       console.log("ShowEachDoc response:", showResult.data);

  //       const raw = showResult.data?.docsContent;

  //       // If API returns REAL JSON (recommended Fix 1), raw is already an object:
  //       // setContent(raw);

  //       // If your API still returns a STRING, safely parse it:
  //       const parsed = typeof raw === "string" ? JSON.parse(raw) : raw ?? null;

  //       setContent(parsed);
  //     } catch (error) {
  //       console.error("Error while fetching document content:", error);
  //     }
  //   };

  //   fetchDocument();
  // }, [documentId]);

  return <SimpleEditor/>;
};

export default DocumentIdPage;
