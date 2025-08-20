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
      authEndpoint="/api/liveblocks-auth"
      resolveUsers={async ({ userIds }) => {
        console.log("Resolving users:", userIds);

        try {
          // ✅ Call your backend API to fetch actual user data
          const response = await fetch('/api/resolve-users', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userIds }),
          });

          if (!response.ok) {
            throw new Error('Failed to resolve users');
          }

          const users = await response.json();
          
          // Return the correct user data for each ID
          return users.map((user) => ({
            name: user.name,
            avatar: user.avatar,
            color: user.color, // ✅ Include user color for cursors
          }));
        } catch (error) {
          console.error('Error resolving users:', error);
          // Fallback: return anonymous users
          return userIds.map(() => ({
            name: "Anonymous",
            avatar: "",
            color: "#999999", // ✅ Default gray color for anonymous users
          }));
        }
      }}
      resolveMentionSuggestions={async ({ text, roomId }) => {
        try {
          // Fetch all users from your backend API
          const response = await fetch('/api/resolve-users', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userIds: [] }), // Empty array to get all users
          });

          if (!response.ok) {
            throw new Error('Failed to fetch users for mentions');
          }

          let users = await response.json();

          // If there's a query, filter for the relevant users
          if (text) {
            // Filter any way you'd like, e.g. checking if the name matches
            users = users.filter((user) => user.name.toLowerCase().includes(text.toLowerCase()));
          }

          // Return the filtered `userIds`
          return users.map((user) => user.id);
        } catch (error) {
          console.error('Error fetching users for mentions:', error);
          return [];
        }
      }}
    >
      <RoomProvider
        id={params.documentId}
        initialPresence={{
          cursor: null,
          name: user?.fullName || "Anonymous",
          avatar: user?.imageUrl || "",
        }}
      >
        <ClientSideSuspense fallback={<div>Loading…</div>}>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
