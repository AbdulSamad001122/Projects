"use client";
import { useUser } from "@clerk/nextjs";

export function useCurrentUserInfo() {
  const { user } = useUser();
  if (!user) return { id: "anonymous", name: "Anonymous", avatar: "" };

  return {
    id: user.id,
    name: user.fullName || user.primaryEmailAddress || "Anonymous",
    avatar: user.imageUrl || "",
  };
}
