import Link from "next/link";

const page = () => {
  return (
    <div className="flex min-h-screen items-center justify-center">
      Click <Link className="text-blue-700" href="/documents/123">here</Link> to go to document id
    </div>
  );
};

export default page;
