"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/dal";
import { revokeSessionById, verifySession } from "@/lib/session";

/**
 * 追加機能: アクティブセッションの個別ログアウト。
 * 他人のセッションを失効させられないよう、所有者チェックを必ず行う。
 */
export async function revokeSessionAction(sessionId: string): Promise<void> {
  const user = await requireUser();

  const target = await prisma.session.findUnique({
    where: { id: sessionId },
  });

  if (!target || target.userId !== user.id) {
    throw new Error("このセッションを操作する権限がありません");
  }

  await revokeSessionById(sessionId);
  revalidatePath("/mypage/sessions");
}

/**
 * 現在のセッション以外の全セッションを一括ログアウトする。
 */
export async function revokeAllOtherSessionsAction(): Promise<void> {
  const current = await verifySession();
  if (!current) {
    throw new Error("ログインが必要です");
  }

  await prisma.session.updateMany({
    where: {
      userId: current.user.id,
      id: { not: current.sessionId },
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });

  revalidatePath("/mypage/sessions");
}
