import { auth } from "@/lib/auth";

export default auth((req) => {
  const isSignIn = req.nextUrl.pathname.startsWith("/signin");
  const isAuthApi = req.nextUrl.pathname.startsWith("/api/auth");

  if (isSignIn || isAuthApi) return;

  if (!req.auth) {
    const signInUrl = new URL("/signin", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.href);
    return Response.redirect(signInUrl);
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
