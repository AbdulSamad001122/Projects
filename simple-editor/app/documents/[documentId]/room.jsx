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
    <LiveblocksProvider publicApiKey="pk_dev_A_cVN8T6vDcDg-7iMMb8n3UX6SUwoS3HR4PVahFiDtGoRzqixr-2dXN8mHlZodrk">
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
