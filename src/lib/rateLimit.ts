import "server-only";
import { prisma } from "@/lib/prisma";

// 追加機能: ログイン試行の間隔制限(レートリミット / アカウントロックアウト)
// 同一メールアドレスへの直近の連続失敗回数が閾値を超えたら、一定時間ログインを拒否する。
// email単位に加えIP単位でも見ることで、単一IPからの複数アカウント総当たりも緩和する。
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 10 * 60 * 1000; // 直近10分間の失敗回数を見る
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 超過時は5分間ロック

export type RateLimitResult =
  | { limited: false }
  | { limited: true; retryAfterSeconds: number };

export async function checkLoginRateLimit(
  email: string,
  ipAddress: string | null,
): Promise<RateLimitResult> {
  const windowStart = new Date(Date.now() - LOCKOUT_WINDOW_MS);

  const recentFailuresByEmail = await prisma.loginAttempt.findMany({
    where: {
      email,
      success: false,
      createdAt: { gte: windowStart },
    },
    orderBy: { createdAt: "desc" },
    take: MAX_FAILED_ATTEMPTS,
  });

  const failuresToCheck = [...recentFailuresByEmail];

  if (ipAddress) {
    const recentFailuresByIp = await prisma.loginAttempt.count({
      where: {
        ipAddress,
        success: false,
        createdAt: { gte: windowStart },
      },
    });
    if (recentFailuresByIp >= MAX_FAILED_ATTEMPTS * 3) {
      return { limited: true, retryAfterSeconds: LOCKOUT_DURATION_MS / 1000 };
    }
  }

  if (failuresToCheck.length < MAX_FAILED_ATTEMPTS) {
    return { limited: false };
  }

  const mostRecentFailure = failuresToCheck[0]!.createdAt;
  const lockedUntil = mostRecentFailure.getTime() + LOCKOUT_DURATION_MS;
  const remainingMs = lockedUntil - Date.now();

  if (remainingMs <= 0) {
    return { limited: false };
  }

  return { limited: true, retryAfterSeconds: Math.ceil(remainingMs / 1000) };
}

export async function recordLoginAttempt(params: {
  email: string;
  success: boolean;
  ipAddress: string | null;
  userAgent: string | null;
  userId?: string;
}): Promise<void> {
  await prisma.loginAttempt.create({
    data: {
      email: params.email,
      success: params.success,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent?.slice(0, 255) ?? null,
      userId: params.userId,
    },
  });
}
