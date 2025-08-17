import React from "react";
import Editor from "./editor";

const documentIdPage = async ({ params }) => {
  const { documentId } = await params;
  return (
    <>
      <div className="min-h-screen bg-[#FAFBFD]">
        <Editor />
      </div>
    </>
  );
};

export default documentIdPage;
