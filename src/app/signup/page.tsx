import type { Metadata } from "next";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = {
  title: "新規登録 | SecureApp",
};

export default function SignupPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
      <h1 className="mb-6 text-center text-2xl font-bold text-zinc-900">新規登録</h1>
      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <SignupForm />
      </div>
    </div>
  );
}
