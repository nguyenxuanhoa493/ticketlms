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

    let user = null;
    let session = null;
    let hasAuthError = false;

    // Only check auth for non-public paths or if we need to redirect logged-in users from auth pages
    try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        const { data: userData, error: userError } = await supabase.auth.getUser();

        // Check for auth errors (invalid/expired tokens)
        if (sessionError || userError) {
            hasAuthError = true;
            console.error("[Middleware] Auth error:", sessionError || userError);
        }

        session = sessionData.session;
        user = userData.user;
    } catch (error) {
        hasAuthError = true;
        console.error("[Middleware] Unexpected auth error:", error);
    }

    // If auth error detected and on public path, clear cookies without redirect
    if (hasAuthError && isPublicPath) {
        console.log("[Middleware] Clearing invalid auth cookies on public path");
        
        // Clear all supabase auth cookies on the response
        const cookiesToClear = [
            'sb-kffuylebxyifkimtcvxh-auth-token',
            'sb-kffuylebxyifkimtcvxh-auth-token.0',
            'sb-kffuylebxyifkimtcvxh-auth-token.1',
        ];
        
        cookiesToClear.forEach(cookieName => {
            response.cookies.set(cookieName, '', {
                maxAge: 0,
                path: '/',
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
            });
        });

        return response;
    }

    // If auth error detected on protected path, clear cookies and redirect to login
    if (hasAuthError && !isPublicPath) {
        console.log("[Middleware] Clearing invalid auth cookies and redirecting to login");
        
        // Create redirect response
        const redirectResponse = NextResponse.redirect(new URL("/login", request.url));
        
        // Clear all supabase auth cookies on the redirect response
        const cookiesToClear = [
            'sb-kffuylebxyifkimtcvxh-auth-token',
            'sb-kffuylebxyifkimtcvxh-auth-token.0',
            'sb-kffuylebxyifkimtcvxh-auth-token.1',
        ];
        
        cookiesToClear.forEach(cookieName => {
            redirectResponse.cookies.set(cookieName, '', {
                maxAge: 0,
                path: '/',
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
            });
        });

        return redirectResponse;
    }

    // Redirect to login if accessing any route without auth (except public paths)
    if (!user && !isPublicPath) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // Redirect to dashboard if logged in user tries to access auth pages
    if (user && isPublicPath && pathname !== "/auth/callback" && pathname !== "/auth/confirmed") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
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
