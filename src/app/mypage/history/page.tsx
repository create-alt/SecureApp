import type { Metadata } from "next";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "ログイン履歴 | SecureApp",
};

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(date);
}

export default async function LoginHistoryPage() {
  const user = await requireUser();

  const attempts = await prisma.loginAttempt.findMany({
    where: { email: user.email },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold text-zinc-900">ログイン履歴</h1>
      <p className="mt-1 text-sm text-zinc-500">
        教材に無い追加機能: 自分のメールアドレス宛のログイン試行(成功・失敗)を直近50件まで表示します。
        身に覚えのない失敗が多い場合は、不正アクセスの兆候として気づけます。
      </p>

      <div className="mt-6 overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-500">
            <tr>
              <th className="px-4 py-2 font-medium">日時</th>
              <th className="px-4 py-2 font-medium">結果</th>
              <th className="px-4 py-2 font-medium">IPアドレス</th>
              <th className="px-4 py-2 font-medium">User-Agent</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((attempt) => (
              <tr key={attempt.id} className="border-b border-zinc-100 last:border-0">
                <td className="px-4 py-2 text-zinc-700">
                  {formatDateTime(attempt.createdAt)}
                </td>
                <td className="px-4 py-2">
                  {attempt.success ? (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      成功
                    </span>
                  ) : (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                      失敗
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-zinc-500">{attempt.ipAddress ?? "不明"}</td>
                <td className="max-w-xs truncate px-4 py-2 text-zinc-500">
                  {attempt.userAgent ?? "不明"}
                </td>
              </tr>
            ))}
            {attempts.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-zinc-400">
                  ログイン履歴はまだありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
