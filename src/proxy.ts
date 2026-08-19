import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/session";

// Next.js 16ではmiddleware.tsはproxy.tsに名称変更された。
// ここではCookieの有無だけを見る「楽観的チェック」でリダイレクトを行い、
// DBを用いた本当のセッション検証は各ページ・Server Actionの requireUser() で行う
// (Proxyだけに認可を頼らない、というNext.js公式のData Access Layerパターンに従う)。
const protectedPrefixes = ["/mypage"];
const authOnlyRoutes = ["/login", "/signup"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSessionCookie = request.cookies.has(SESSION_COOKIE_NAME);

  const isProtected = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix),
  );
  if (isProtected && !hasSessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isAuthOnly = authOnlyRoutes.includes(pathname);
  if (isAuthOnly && hasSessionCookie) {
    return NextResponse.redirect(new URL("/mypage", request.url));
  }

  // CSP: リクエスト毎に乱数nonceを発行し、Next.jsが自動生成する
  // フレームワークのインラインスクリプトにだけ実行を許可する(strict-dynamic)。
  // 'unsafe-inline' を使わないことで、万一XSSでスクリプトを注入されても
  // nonceを知らない攻撃者のスクリプトは実行できない(最後の砦としてのCSP)。
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";

  const cspHeader = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' ${isDev ? "'unsafe-inline'" : `'nonce-${nonce}'`}`,
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", cspHeader);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  response.headers.set("Content-Security-Policy", cspHeader);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "DENY");

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
