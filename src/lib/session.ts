import "server-only";
import { cookies, headers } from "next/headers";
import { createHash, randomBytes } from "crypto";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/request";

export const SESSION_COOKIE_NAME = "session_token";

// Remember meなし: 6時間(ブラウザを閉じたら実質切れる用途を想定)
const DEFAULT_SESSION_TTL_MS = 6 * 60 * 60 * 1000;
// 教材に無い追加機能「Remember me」: チェック時は30日間セッションを保持する
const REMEMBER_ME_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * ログイン成功時にDBへセッションを作成し、生トークンをhttpOnly Cookieにセットする。
 * DBには生トークンではなくSHA-256ハッシュのみを保存する(DB漏洩時の対策)。
 */
export async function createSession(
  userId: string,
  rememberMe: boolean,
): Promise<void> {
  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(rawToken);
  const ttl = rememberMe ? REMEMBER_ME_TTL_MS : DEFAULT_SESSION_TTL_MS;
  const expiresAt = new Date(Date.now() + ttl);

  const requestHeaders = await headers();

  await prisma.session.create({
    data: {
      tokenHash,
      userId,
      rememberMe,
      userAgent: requestHeaders.get("user-agent")?.slice(0, 255) ?? null,
      ipAddress: getClientIp(requestHeaders),
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: rememberMe ? expiresAt : undefined,
  });
}

export type SessionUser = {
  id: string;
  email: string;
  name: string;
};

type VerifiedSession = {
  sessionId: string;
  user: SessionUser;
};

/**
 * 現在のリクエストのセッションCookieを検証し、有効ならユーザー情報を返す。
 * Reactのcache()でリクエスト内メモ化し、同一リクエスト中の重複DBアクセスを避ける。
 */
export const verifySession = cache(
  async (): Promise<VerifiedSession | null> => {
    const cookieStore = await cookies();
    const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!rawToken) return null;

    const tokenHash = hashToken(rawToken);
    const session = await prisma.session.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (
      !session ||
      session.revokedAt !== null ||
      session.expiresAt.getTime() < Date.now()
    ) {
      return null;
    }

    // 最終アクティブ日時を更新(アクティブセッション一覧に表示するため)
    // 頻繁な書き込みを避けるため、5分以上経過している場合のみ更新する
    if (Date.now() - session.lastActiveAt.getTime() > 5 * 60 * 1000) {
      await prisma.session.update({
        where: { id: session.id },
        data: { lastActiveAt: new Date() },
      });
    }

    return {
      sessionId: session.id,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      },
    };
  },
);

/**
 * 現在のセッションを失効させ、Cookieを削除する(ログアウト)。
 */
export async function destroyCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (rawToken) {
    const tokenHash = hashToken(rawToken);
    await prisma.session
      .updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      })
      .catch(() => undefined);
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * 指定したセッションIDを失効させる。
 * 呼び出し側で「操作対象セッションの持ち主 === ログイン中ユーザー」を必ず確認すること。
 */
export async function revokeSessionById(sessionId: string): Promise<void> {
  await prisma.session.update({
    where: { id: sessionId },
    data: { revokedAt: new Date() },
  });
}
