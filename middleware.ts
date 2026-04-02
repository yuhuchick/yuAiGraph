import { NextRequest, NextResponse } from "next/server";

/** 需要登录才能访问的路由前缀 */
const PROTECTED_PREFIXES = ["/dashboard", "/note"];
/** 已登录用户应跳过的页面（避免重复登录） */
const AUTH_ONLY_PREFIXES = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLoggedIn = request.cookies.has("kg_logged_in");

  // 受保护路由：未登录 → 跳转到登录页，并记录来源路径
  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 认证页面：已登录 → 跳转到仪表盘
  if (AUTH_ONLY_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // 排除 Next.js 内部路径、静态资源和 API 路由（API 路由由 Java 层做 JWT 校验）
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
