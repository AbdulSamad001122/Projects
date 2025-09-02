import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ItemManagement from "@/components/item-management";

export default async function ItemsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/signin");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ItemManagement />
    </div>
  );
}
