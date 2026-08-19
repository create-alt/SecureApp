import "server-only";
import { redirect } from "next/navigation";
import { verifySession, type SessionUser } from "@/lib/session";

/**
 * ログイン必須ページ・Server Action用のガード。
 * 未ログインの場合は/loginへリダイレクトする(Data Access Layerパターン)。
 * Proxy(旧middleware)での楽観的チェックとは別に、データソースに近い場所で
 * 必ずこの関数を通してセッションを検証する。
 */
export async function requireUser(): Promise<SessionUser> {
  const session = await verifySession();
  if (!session) {
    redirect("/login");
  }
  return session.user;
}
