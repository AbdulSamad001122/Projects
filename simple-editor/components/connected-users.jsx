"use client";
import React from "react";
import { useOthers, useSelf } from "@liveblocks/react/suspense";

export function ConnectedUsers() {
  // Always call hooks at the top level
  const others = useOthers();
  const self = useSelf();

  // Combine self and others to show all connected users
  const allUsers = [
    ...(self ? [{ connectionId: 'self', info: self.info }] : []),
    ...others.map(user => ({ connectionId: user.connectionId, info: user.info }))
  ];

  if (allUsers.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center">
      {/* Overlapping avatars container */}
      <div className="flex items-center">
        {allUsers.map((user, index) => (
          <div
            key={user.connectionId}
            className="relative flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-lg overflow-hidden transition-transform hover:scale-110 hover:z-50"
            style={{
              backgroundColor: user.info?.color || '#9CA3AF',
              marginLeft: index > 0 ? '-12px' : '0',
              zIndex: allUsers.length - index, // Higher z-index for users on the left
            }}
            title={user.info?.name || 'Anonymous'}
          >
            {user.info?.avatar ? (
              <img
                src={user.info.avatar}
                alt={user.info.name || 'User'}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white text-xs font-medium">
                {(user.info?.name || 'A').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        ))}
      </div>
      
      {/* User count */}
      {allUsers.length > 0 && (
        <span className="text-sm text-gray-500 ml-3 font-medium">
          {allUsers.length} online
        </span>
      )}
    </div>
  );
}