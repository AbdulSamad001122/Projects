// "use client";

// import { useEffect, useState } from "react";
// import axios from "axios";
// import { useAuth } from "@clerk/nextjs";
// import { useRouter } from "next/navigation";
// import { Loader2, Trash2 } from "lucide-react"; // ✅ Trash icon
// import Navbar from "@/components/myComponents/Navbar";

// // helper: extract preview text or image from Tiptap JSON
// function getPreviewContent(content) {
//   if (!content || !content.content) return { text: "", image: null };

//   let textParts = [];
//   let image = null;

//   for (const node of content.content) {
//     if (!image && node.type === "image" && node.attrs?.src) {
//       image = node.attrs.src;
//     }
//     if (
//       (node.type === "paragraph" || node.type === "heading") &&
//       node.content
//     ) {
//       const text = node.content.map((c) => c.text || "").join(" ");
//       if (text.trim()) {
//         textParts.push(text);
//       }
//     }
//   }

//   const fullText = textParts.join(" ").trim();

//   return {
//     text: fullText.length > 500 ? fullText.slice(0, 500) + "..." : fullText,
//     image,
//   };
// }

// export default function DocumentDisplay() {
//   const { userId } = useAuth();
//   const [docs, setDocs] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const router = useRouter();

//   useEffect(() => {
//     if (!userId) return;

//     const fetchDocs = async () => {
//       setLoading(true);
//       try {
//         const res = await axios.get("/api/getAllDoc", { params: { userId } });
//         setDocs(res.data);
//       } catch (err) {
//         console.error("Error fetching docs:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchDocs();
//   }, [userId]);

//   // ✅ Handle delete
//   const handleDelete = async (e, docId) => {
//     e.stopPropagation(); // prevent navigation
//     try {
//       await axios.delete(`/api/deleteDoc`, { data: { id: docId } });
//       setDocs((prev) => prev.filter((doc) => doc.id !== docId));
//     } catch (err) {
//       console.error("Error deleting doc:", err);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-40 text-gray-300">
//         <Loader2 className="animate-spin w-6 h-6 mr-2" />
//         Loading documents...
//       </div>
//     );
//   }

//   if (!docs.length) {
//     return (
//       <div className="text-gray-400 text-center py-10">
//         No documents found. Create one to get started.
//       </div>
//     );
//   }

//   return (
//     <>
//       <Navbar />
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6 bg-black min-h-screen">
//         {docs.map((doc) => {
//           const preview = getPreviewContent(doc.content);

//           return (
//             <div
//               key={doc.id}
//               className="bg-gray-900 rounded-2xl shadow-lg hover:shadow-xl hover:bg-gray-800 transition flex flex-col relative h-[300px]"
//               onClick={() => router.push(`/documents/${doc.id}`)}
//             >
//               {/* Delete button */}
//               <button
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   setDocToDelete(doc); // save which doc to delete
//                   setShowDeleteModal(true);
//                 }}
//                 className="absolute top-2 right-2 p-2 rounded-full bg-gray-700 text-white hover:bg-red-500 transition cursor-pointer"
//               >
//                 <Trash2 size={16} />
//               </button>

//               <div className="h-32 bg-gray-800 rounded-t-2xl p-3 overflow-hidden flex items-center justify-center">
//                 {preview.image ? (
//                   <img
//                     src={preview.image}
//                     alt="Doc preview"
//                     className="object-contain max-h-full"
//                   />
//                 ) : preview.text ? (
//                   <p className="text-sm text-gray-300 line-clamp-4">
//                     {preview.text}
//                   </p>
//                 ) : (
//                   <p className="text-gray-500 text-sm">No preview available</p>
//                 )}
//               </div>

//               {/* Info area */}
//               <div className="p-4 border-t border-gray-700">
//                 <h3 className="text-md font-semibold text-white truncate mb-1">
//                   {doc.title || "Untitled Document"}
//                 </h3>
//                 <br />
//                 <div className="text-xs text-gray-400">
//                   <p>
//                     📅 Created: {new Date(doc.createdAt).toLocaleDateString()}
//                   </p>
//                   <p>
//                     ⏳ Updated: {new Date(doc.updatedAt).toLocaleDateString()}
//                   </p>
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Loader2, Trash2 } from "lucide-react";
import Navbar from "@/components/myComponents/Navbar"; // import your Navbar

// Helper to extract preview text or image from Tiptap JSON
function getPreviewContent(content) {
  if (!content || !content.content) return { text: "", image: null };

  let textParts = [];
  let image = null;

  for (const node of content.content) {
    if (!image && node.type === "image" && node.attrs?.src) {
      image = node.attrs.src;
    }
    if (
      (node.type === "paragraph" || node.type === "heading") &&
      node.content
    ) {
      const text = node.content.map((c) => c.text || "").join(" ");
      if (text.trim()) textParts.push(text);
    }
  }

  const fullText = textParts.join(" ").trim();

  return {
    text: fullText.length > 500 ? fullText.slice(0, 500) + "..." : fullText,
    image,
  };
}

export default function DocumentsPage() {
  const { userId } = useAuth();
  const router = useRouter();

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);
  const [buttonloading, setbuttonLoading] = useState(false); // 🔹 New state for spinner

  // Fetch all docs for this user
  useEffect(() => {
    if (!userId) return;

    const fetchDocs = async () => {
      setLoading(true);
      try {
        const res = await axios.get("/api/getAllDoc", { params: { userId } });
        setDocs(res.data);
      } catch (err) {
        console.error("Error fetching docs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDocs();
  }, [userId]);

  // Delete a doc
  const confirmDelete = async () => {
    try {
      setbuttonLoading(true); // 🔹 Start loading
      await axios.delete("/api/deleteDoc", { data: { id: docToDelete.id } });
      setDocs((prev) => prev.filter((d) => d.id !== docToDelete.id));
      setShowDeleteModal(false);
      setDocToDelete(null);
    } catch (err) {
      console.error("Error deleting doc:", err);
    } finally {
      setbuttonLoading(false); // 🔹 Start loading
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDocToDelete(null);
  };

  // Filter docs by search query
  const filteredDocs = docs.filter((doc) => {
    return doc.title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Render loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-40 text-gray-300">
        <Loader2 className="animate-spin w-6 h-6 mr-2" />
        Loading documents...
      </div>
    );
  }

  return (
    <>
      <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6 bg-black min-h-screen">
        {filteredDocs.map((doc) => {
          const preview = getPreviewContent(doc.content);
          return (
            <div
              key={doc.id}
              className="bg-gray-900 rounded-2xl shadow-lg hover:shadow-xl hover:bg-gray-800 transition flex flex-col relative h-[300px] cursor-pointer"
              onClick={() => router.push(`/documents/${doc.id}`)}
            >
              {/* Delete button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDocToDelete(doc);
                  setShowDeleteModal(true);
                }}
                className="absolute top-2 right-2 p-2 rounded-full bg-gray-700 text-white hover:bg-red-500 transition"
              >
                <Trash2 size={16} />
              </button>

              {/* Preview */}
              <div className="h-32 bg-gray-800 rounded-t-2xl p-3 overflow-hidden flex items-center justify-center">
                {preview.image ? (
                  <img
                    src={preview.image}
                    alt="Doc preview"
                    className="object-contain max-h-full"
                  />
                ) : preview.text ? (
                  <p className="text-sm text-gray-300 line-clamp-4">
                    {preview.text}
                  </p>
                ) : (
                  <p className="text-gray-500 text-sm">No preview available</p>
                )}
              </div>

              {/* Info */}
              <div className="p-4 border-t border-gray-700">
                <h3 className="text-md font-semibold text-white truncate mb-1">
                  {doc.title || "Untitled Document"}
                </h3>
                <br/>
                <div className="text-xs text-gray-400">
                  <p>
                    📅 Created: {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                  <p>
                    ⏳ Updated: {new Date(doc.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        {filteredDocs.length === 0 && (
          <div className="text-gray-400 text-center py-10 col-span-full">
            No documents match your search.
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white/80 backdrop-blur-md p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4 text-black">
              Delete Document
            </h2>
            <p className="text-black mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                {docToDelete?.title || "Untitled Document"}
              </span>
              ?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={cancelDelete}
                className="px-3 py-1.5 rounded-md border border-gray-300 bg-black text-white hover:bg-gray-500 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-800 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
                disabled={buttonloading}
              >
                {buttonloading && (
                  <Loader2 className="animate-spin w-5 h-5 text-white" />
                )}
                <span>{buttonloading ? "Deleting..." : "Delete"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
