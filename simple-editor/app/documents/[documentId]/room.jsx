"use client";

import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";
import { useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export function Room({ children }) {
  const params = useParams();
  const { user } = useUser();

  return (
    <LiveblocksProvider
      publicApiKey="pk_dev_A_cVN8T6vDcDg-7iMMb8n3UX6SUwoS3HR4PVahFiDtGoRzqixr-2dXN8mHlZodrk"
      resolveUsers={async ({ userIds }) => {
        console.log("Resolving users:", userIds);

        // ⚡️ Example: match Clerk user with Liveblocks userId
        // In production, call your backend with userIds to fetch Clerk users.
        return userIds.map((id) => ({
          name: user?.fullName || "Anonymous",
          avatar: user?.imageUrl || "",
          // add custom metadata if needed
        }));
      }}
      resolveMentionSuggestions={async ({ text, roomId }) => {
        // Fetch all users from your back end
        let users = await __fetchAllUsers__();

        // If there's a query, filter for the relevant users
        if (text) {
          // Filter any way you'd like, e.g. checking if the name matches
          users = users.filter((user) => user.name.includes(text));
        }

        // Return the filtered `userIds`
        return users.map((user) => user.id);
      }}
    >
      <RoomProvider
        id={params.documentId}
        initialPresence={{
          cursor: null, // each user starts with no cursor
          name: user?.fullName || "Anonymous", // ✅ Clerk full name here
          avatar: user?.imageUrl, // ✅ Clerk profile image
        }}
      >
        <ClientSideSuspense fallback={<div>Loading…</div>}>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}

