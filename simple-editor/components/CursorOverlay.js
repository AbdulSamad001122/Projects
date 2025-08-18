"use client";
import { useOthers } from "@liveblocks/react";

export default function CursorOverlay() {
  const others = useOthers();

  return (
    <>
      {others.map(({ connectionId, info, presence }) => {
        // Skip if no cursor position
        if (!presence?.cursor) return null;
        
        const { x, y } = presence.cursor;
        
        return (
          <div
            key={connectionId}
            className="cursor"
            style={{
              position: "absolute",
              pointerEvents: "none",
              left: x,
              top: y,
              zIndex: 1000,
            }}
          >
            <span
              className="bg-black text-white text-xs rounded px-1 py-0.5"
              style={{
                position: "relative",
                top: "-10px",
                left: "-10px",
              }}
            >
              {info.name}
            </span>
          </div>
        );
      })}
    </>
  );
}
