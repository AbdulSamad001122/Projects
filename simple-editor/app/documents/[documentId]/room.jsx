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
    <LiveblocksProvider authEndpoint={"/api/liveblocks-auth"}> {/* Use auth endpoint instead of public API key */}
      <RoomProvider
        id={params.documentId}
        initialPresence={{
          cursor: null, // each user starts with no cursor
          name: user?.fullName || "Anonymous", // ✅ Clerk full name here
          avatar: user?.imageUrl, // (optional) Clerk profile image
        }}
      >
        <ClientSideSuspense fallback={<div>Loading…</div>}>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
