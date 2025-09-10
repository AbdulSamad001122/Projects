import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">For Pappa</h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>
        <SignIn />
      </div>
    </div>
  );
}
