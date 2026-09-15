import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase-config";

const LOCAL_SESSION_COOKIE = "activ_local_session";
const PROTECTED_PREFIXES = ["/app", "/onboarding"];
const AUTH_PAGES = ["/login", "/signup"];

/**
 * Session refresh + coarse route protection. Fine-grained ownership checks
 * happen server-side in every action/route; this only redirects.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const localMode = process.env.ACTIV_DATA_MODE === "local";
  const supabaseUrl = localMode ? undefined : SUPABASE_URL;
  const supabaseKey = localMode ? undefined : SUPABASE_ANON_KEY;

  let response = NextResponse.next({ request });
  let authenticated = false;

  if (supabaseUrl && supabaseKey) {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        },
      },
    });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    authenticated = Boolean(user);
  } else {
    authenticated = Boolean(request.cookies.get(LOCAL_SESSION_COOKIE)?.value);
  }

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isAuthPage = AUTH_PAGES.includes(pathname);

  if (isProtected && !authenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (isAuthPage && authenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/app";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ["/app/:path*", "/onboarding/:path*", "/login", "/signup"],
};
