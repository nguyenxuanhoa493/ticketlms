import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },
                set(
                    name: string,
                    value: string,
                    options: Record<string, unknown>
                ) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    });
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    });
                },
                remove(name: string, options: Record<string, unknown>) {
                    request.cookies.set({
                        name,
                        value: "",
                        ...options,
                    });
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    response.cookies.set({
                        name,
                        value: "",
                        ...options,
                    });
                },
            },
        }
    );

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
        // Get both session and user for better debugging
        const { data: sessionData } = await supabase.auth.getSession();
        const { data: userData } = await supabase.auth.getUser();

        session = sessionData.session;
        user = userData.user;
    } catch (error) {
        console.log("❌ Middleware auth error:", error);
    }

    // Redirect to login if accessing any route without auth (except public paths)
    if (!user) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // Redirect to dashboard if logged in user tries to access auth pages
    if (pathname === "/login" || pathname === "/register") {
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
