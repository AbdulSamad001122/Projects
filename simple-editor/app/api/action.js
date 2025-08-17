"use server";

import { clerkClient } from "@clerk/nextjs/server";

export async function fetchUsers() {
  const response = await clerkClient.users.getUserList();
  return response.map(user => ({
    id: user.id,
    name: user.fullName || (user.primaryEmailAddress?.emailAddress) || "Anonymous",
    avatar: user.profileImageUrl,
  }));
}
