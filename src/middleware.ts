import { createMiddlewareClient } from "@/lib/supabase/middleware-client";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
    const response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    // Add cache headers for static assets
    if (
        request.nextUrl.pathname.startsWith("/_next/static") ||
        request.nextUrl.pathname.startsWith("/_next/image") ||
        request.nextUrl.pathname.includes("favicon.ico")
    ) {
        response.headers.set(
            "Cache-Control",
            "public, max-age=31536000, immutable"
        );
        return response;
    }

    const supabase = createMiddlewareClient(request, response);

    // Skip middleware for static files and api routes
    const { pathname } = request.nextUrl;
    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/api") ||
        pathname.includes("favicon.ico") ||
        pathname.includes(".")
    ) {
        return response;
    }

    // Public routes that don't need auth - check first for better performance
    const publicPaths = ["/login", "/register", "/auth"];
    const isPublicPath = publicPaths.some(
        (path) => pathname === path || pathname.startsWith(path)
    );

    // If it's a public path, we don't need to check auth
    if (isPublicPath) {
        return response;
    }

    let user = null;
    let session = null;

    try {
        const { data: sessionData } = await supabase.auth.getSession();
        const { data: userData } = await supabase.auth.getUser();

        session = sessionData.session;
        user = userData.user;
    } catch (error) {
        // Silent error handling
    }

    // Redirect to login if accessing any route without auth (except public paths)
    if (!user) {
        // Chỉ redirect nếu không phải là trang login/register
        if (pathname !== "/login" && pathname !== "/register") {
            return NextResponse.redirect(new URL("/login", request.url));
        }
    } else {
        // Redirect to dashboard if logged in user tries to access auth pages
        if (pathname === "/login" || pathname === "/register") {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
};
