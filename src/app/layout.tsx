import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { verifySession } from "@/lib/session";
import { logout } from "@/app/actions/auth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SecureApp | セッションベース認証デモ",
  description: "Next.jsで実装したセッションベース認証・認可のデモアプリ",
};

export default async function RootLayout({
  children,
}: LayoutProps<"/">) {
  const session = await verifySession();

  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900">
        <header className="border-b border-zinc-200 bg-white">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
            <Link href="/" className="font-bold tracking-tight text-zinc-900">
              SecureApp
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              {session ? (
                <>
                  <Link href="/mypage" className="text-zinc-600 hover:text-zinc-900">
                    マイページ
                  </Link>
                  <Link
                    href="/mypage/sessions"
                    className="text-zinc-600 hover:text-zinc-900"
                  >
                    セッション管理
                  </Link>
                  <Link
                    href="/mypage/history"
                    className="text-zinc-600 hover:text-zinc-900"
                  >
                    ログイン履歴
                  </Link>
                  <span className="text-zinc-400">|</span>
                  <span className="text-zinc-700">{session.user.name} さん</span>
                  <form action={logout}>
                    <button
                      type="submit"
                      className="rounded-md border border-zinc-300 px-3 py-1.5 text-zinc-700 hover:bg-zinc-100"
                    >
                      ログアウト
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-zinc-600 hover:text-zinc-900">
                    ログイン
                  </Link>
                  <Link
                    href="/signup"
                    className="rounded-md bg-zinc-900 px-3 py-1.5 text-white hover:bg-zinc-700"
                  >
                    新規登録
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>
        <main className="flex flex-1 flex-col">{children}</main>
      </body>
    </html>
  );
}
