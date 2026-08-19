"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSession, destroyCurrentSession } from "@/lib/session";
import { signupSchema, loginSchema } from "@/lib/validation";
import { checkLoginRateLimit, recordLoginAttempt } from "@/lib/rateLimit";
import { getClientIp } from "@/lib/request";

export type FormState = {
  errors?: Record<string, string[]>;
  message?: string;
  // バリデーション/重複エラー時に入力値(パスワード以外)を画面に復元するためのもの。
  // 再レンダー時にinput要素を強制的に再マウントさせ、defaultValueを効かせるためのkeyも兼ねる。
  attemptId?: string;
  values?: { name?: string; email?: string };
} | undefined;

export async function signup(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const rawName = String(formData.get("name") ?? "");
  const rawEmail = String(formData.get("email") ?? "");
  const values = { name: rawName, email: rawEmail };

  const validated = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      attemptId: crypto.randomUUID(),
      values,
    };
  }

  const { name, email, password } = validated.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return {
      errors: { email: ["このメールアドレスは既に登録されています"] },
      attemptId: crypto.randomUUID(),
      values,
    };
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  });

  await createSession(user.id, false);
  redirect("/mypage");
}

export async function login(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const rawEmail = String(formData.get("email") ?? "");
  const values = { email: rawEmail };

  const validated = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    rememberMe: formData.get("rememberMe") === "on",
  });

  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      attemptId: crypto.randomUUID(),
      values,
    };
  }

  const { email, password, rememberMe } = validated.data;
  const requestHeaders = await headers();
  const ipAddress = getClientIp(requestHeaders);
  const userAgent = requestHeaders.get("user-agent");

  const rateLimit = await checkLoginRateLimit(email, ipAddress);
  if (rateLimit.limited) {
    return {
      message: `ログイン試行回数が上限に達しました。${rateLimit.retryAfterSeconds}秒後に再度お試しください。`,
      attemptId: crypto.randomUUID(),
      values,
    };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  const passwordValid = user
    ? await verifyPassword(password, user.passwordHash)
    : false;

  if (!user || !passwordValid) {
    await recordLoginAttempt({
      email,
      success: false,
      ipAddress,
      userAgent,
      userId: user?.id,
    });
    // メールアドレスの存在有無を推測させない、統一されたエラーメッセージ
    return {
      message: "メールアドレスまたはパスワードが正しくありません",
      attemptId: crypto.randomUUID(),
      values,
    };
  }

  await recordLoginAttempt({
    email,
    success: true,
    ipAddress,
    userAgent,
    userId: user.id,
  });

  await createSession(user.id, rememberMe);
  redirect("/mypage");
}

export async function logout(): Promise<void> {
  await destroyCurrentSession();
  redirect("/login");
}
