import type { Metadata } from "next";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";
import {
  revokeSessionAction,
  revokeAllOtherSessionsAction,
} from "@/app/actions/sessions";

export const metadata: Metadata = {
  title: "セッション管理 | SecureApp",
};

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function SessionsPage() {
  const user = await requireUser();
  const current = await verifySession();

  const sessions = await prisma.session.findMany({
    where: { userId: user.id, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { lastActiveAt: "desc" },
  });

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">アクティブなセッション</h1>
          <p className="mt-1 text-sm text-zinc-500">
            現在ログイン中の全デバイス/ブラウザの一覧です。教材に無い追加機能として、
            自分以外のセッションだけを個別にログアウトさせることができます。
          </p>
        </div>
        {sessions.length > 1 && (
          <form action={revokeAllOtherSessionsAction}>
            <button
              type="submit"
              className="whitespace-nowrap rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
            >
              他の全セッションをログアウト
            </button>
          </form>
        )}
      </div>

      <ul className="mt-6 space-y-3">
        {sessions.map((session) => {
          const isCurrent = session.id === current?.sessionId;
          return (
            <li
              key={session.id}
              className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-medium text-zinc-900">
                    {session.userAgent ?? "不明なデバイス"}
                    {isCurrent && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        現在のセッション
                      </span>
                    )}
                    {session.rememberMe && (
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                        Remember me
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    IPアドレス: {session.ipAddress ?? "不明"}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    最終アクティブ: {formatDateTime(session.lastActiveAt)}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    有効期限: {formatDateTime(session.expiresAt)}
                  </p>
                </div>
                {!isCurrent && (
                  <form action={revokeSessionAction.bind(null, session.id)}>
                    <button
                      type="submit"
                      className="whitespace-nowrap rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100"
                    >
                      ログアウト
                    </button>
                  </form>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
