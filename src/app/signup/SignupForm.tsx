"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup, type FormState } from "@/app/actions/auth";
import { PasswordField } from "@/components/PasswordField";
import { SubmitButton } from "@/components/SubmitButton";

export function SignupForm() {
  const [state, action] = useActionState<FormState, FormData>(
    signup,
    undefined,
  );

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-zinc-700">
          お名前
        </label>
        <input
          key={`name-${state?.attemptId ?? "initial"}`}
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          defaultValue={state?.values?.name}
          className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
        />
        {state?.errors?.name && (
          <p className="mt-1 text-xs text-red-600">{state.errors.name[0]}</p>
        )}
      </div>

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
        label="パスワード(8文字以上、英字と数字を含む)"
        autoComplete="new-password"
        showStrengthMeter
        error={state?.errors?.password}
      />

      <PasswordField
        name="confirmPassword"
        label="パスワード(確認用)"
        autoComplete="new-password"
        error={state?.errors?.confirmPassword}
      />

      {state?.message && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.message}
        </p>
      )}

      <SubmitButton>登録する</SubmitButton>

      <p className="text-center text-sm text-zinc-500">
        既にアカウントをお持ちの場合は{" "}
        <Link href="/login" className="font-medium text-zinc-900 underline">
          ログイン
        </Link>
      </p>
    </form>
  );
}
