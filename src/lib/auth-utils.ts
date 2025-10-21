/**
 * Authentication utility functions
 */

/**
 * Clear all Supabase auth cookies and storage
 * Use this when you detect invalid/expired tokens
 */
export function clearAuthData() {
    console.log("[Auth Utils] Clearing all auth data...");

    // Clear localStorage
    if (typeof window !== 'undefined') {
        Object.keys(localStorage).forEach(key => {
            if (key.includes('supabase') || key.includes('sb-') || key.includes('auth')) {
                console.log(`[Auth Utils] Removing localStorage: ${key}`);
                localStorage.removeItem(key);
            }
        });

        // Clear sessionStorage
        Object.keys(sessionStorage).forEach(key => {
            if (key.includes('supabase') || key.includes('sb-') || key.includes('auth')) {
                console.log(`[Auth Utils] Removing sessionStorage: ${key}`);
                sessionStorage.removeItem(key);
            }
        });

        // Clear cookies (best effort - some may be httpOnly and can't be cleared from JS)
        document.cookie.split(";").forEach(cookie => {
            const name = cookie.split("=")[0].trim();
            if (name.includes('supabase') || name.includes('sb-') || name.includes('auth')) {
                console.log(`[Auth Utils] Removing cookie: ${name}`);
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
            }
        });

        console.log("[Auth Utils] Auth data cleared");
    }
}

/**
 * Check if current session is valid
 * Returns true if session exists and is not expired
 */
export function isSessionValid(session: any): boolean {
    if (!session) return false;
    
    const expiresAt = session.expires_at;
    if (!expiresAt) return false;
    
    const now = Math.floor(Date.now() / 1000);
    return now < expiresAt;
}

/**
 * Get clean login URL (removes any error query params)
 */
export function getCleanLoginUrl(): string {
    return '/login';
}

/**
 * Redirect to login and clear auth data
 */
export function redirectToLogin() {
    clearAuthData();
    window.location.href = getCleanLoginUrl();
}

/**
 * Handle auth errors consistently
 */
export function handleAuthError(error: any) {
    console.error("[Auth Error]", error);
    
    // Common auth errors that require re-login
    const reLoginErrors = [
        'refresh_token_not_found',
        'invalid_token',
        'token_expired',
        'session_not_found',
    ];

    const errorCode = error?.code || error?.status;
    const errorMessage = error?.message || '';

    if (reLoginErrors.some(code => errorCode === code || errorMessage.includes(code))) {
        console.log("[Auth Error] Session invalid, clearing data and redirecting to login");
        redirectToLogin();
        return true;
    }

    return false;
}
