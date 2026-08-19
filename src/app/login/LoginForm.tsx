"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, type FormState } from "@/app/actions/auth";
import { PasswordField } from "@/components/PasswordField";
import { SubmitButton } from "@/components/SubmitButton";

export function LoginForm() {
  const [state, action] = useActionState<FormState, FormData>(
    login,
    undefined,
  );

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
          メールアドレス
        </label>
        <input
          key={`email-${state?.attemptId ?? "initial"}`}
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state?.values?.email}
          className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
        />
        {state?.errors?.email && (
          <p className="mt-1 text-xs text-red-600">{state.errors.email[0]}</p>
        )}
      </div>

      <PasswordField
        name="password"
        label="パスワード"
        autoComplete="current-password"
        error={state?.errors?.password}
      />

      <div className="flex items-center gap-2">
        <input
          id="rememberMe"
          name="rememberMe"
          type="checkbox"
          className="h-4 w-4 rounded border-zinc-300"
        />
        <label htmlFor="rememberMe" className="text-sm text-zinc-700">
          ログイン状態を保持する(Remember me / 30日間)
        </label>
      </div>

      {state?.message && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.message}
        </p>
      )}

      <SubmitButton>ログイン</SubmitButton>

      <p className="text-center text-sm text-zinc-500">
        アカウントをお持ちでない場合は{" "}
        <Link href="/signup" className="font-medium text-zinc-900 underline">
          新規登録
        </Link>
      </p>
    </form>
  );
}
