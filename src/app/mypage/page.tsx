import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "マイページ | SecureApp",
};

export default async function MyPage() {
  const user = await requireUser();

  const [activeSessionCount, recentFailedLogins] = await Promise.all([
    prisma.session.count({
      where: { userId: user.id, revokedAt: null, expiresAt: { gt: new Date() } },
    }),
    prisma.loginAttempt.count({
      where: { email: user.email, success: false },
    }),
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold text-zinc-900">マイページ</h1>
      <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-zinc-500">お名前</dt>
            <dd className="text-base text-zinc-900">{user.name}</dd>
          </div>
          <div>
            <dt className="text-sm text-zinc-500">メールアドレス</dt>
            <dd className="text-base text-zinc-900">{user.email}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/mypage/sessions"
          className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-zinc-400"
        >
          <p className="text-sm text-zinc-500">現在アクティブなセッション</p>
          <p className="mt-2 text-3xl font-bold text-zinc-900">{activeSessionCount}</p>
          <p className="mt-2 text-sm text-zinc-500">一覧・個別ログアウトはこちら →</p>
        </Link>
        <Link
          href="/mypage/history"
          className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-zinc-400"
        >
          <p className="text-sm text-zinc-500">過去のログイン失敗回数</p>
          <p className="mt-2 text-3xl font-bold text-zinc-900">{recentFailedLogins}</p>
          <p className="mt-2 text-sm text-zinc-500">ログイン履歴はこちら →</p>
        </Link>
      </div>
    </div>
  );
}
