import { NextResponse } from "next/server";
import { auth } from "@/auth";

const PUBLIC = ["/login", "/api/auth", "/api/health"];

export default async function middleware(req: { nextUrl: { pathname: string } }) {
  const pathname = req.nextUrl.pathname;
  if (PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next();
  if (pathname === "/") return NextResponse.next();
  const session = await auth();
  const user = (session as unknown as { user?: { id?: string } } | null)?.user;
  if (!user?.id) {
    const url = new URL("/login", (req as unknown as { url: string }).url);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/students/:path*", "/referrals/:path*", "/cases/:path*", "/calendar/:path*", "/tasks/:path*", "/settings/:path*"],
};
