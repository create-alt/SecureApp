import Link from "next/link";
import { verifySession } from "@/lib/session";

export default async function Home() {
  const session = await verifySession();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-20 text-center">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
        SecureApp
      </h1>
      <p className="mt-4 max-w-xl text-zinc-600">
        Next.js App Router で実装した、セッションベース認証・認可のデモアプリです。
        bcryptによるパスワードハッシュ化、httpOnly Cookie、DBセッション管理、
        ログイン試行のレート制限、アクティブセッションの一覧・個別ログアウトなどを実装しています。
      </p>
      <div className="mt-8 flex gap-4">
        {session ? (
          <Link
            href="/mypage"
            className="rounded-md bg-zinc-900 px-5 py-2.5 text-white hover:bg-zinc-700"
          >
            マイページへ
          </Link>
        ) : (
          <>
            <Link
              href="/signup"
              className="rounded-md bg-zinc-900 px-5 py-2.5 text-white hover:bg-zinc-700"
            >
              新規登録
            </Link>
            <Link
              href="/login"
              className="rounded-md border border-zinc-300 px-5 py-2.5 text-zinc-700 hover:bg-zinc-100"
            >
              ログイン
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
