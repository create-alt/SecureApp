import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "ログイン | SecureApp",
};

export default function LoginPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
      <h1 className="mb-6 text-center text-2xl font-bold text-zinc-900">ログイン</h1>
      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <LoginForm />
      </div>
    </div>
  );
}
