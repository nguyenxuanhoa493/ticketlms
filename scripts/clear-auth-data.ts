/**
 * Script to clear all authentication data from browser
 * Run this script in browser console or add to a page to force logout
 * 
 * Usage in browser console:
 * 1. Open DevTools (F12)
 * 2. Go to Console tab
 * 3. Copy and paste this entire script
 * 4. Press Enter
 */

(function clearAllAuthData() {
    console.log("🔄 Starting to clear all authentication data...");

    // 1. Clear all localStorage
    console.log("📦 Clearing localStorage...");
    const localStorageKeys = Object.keys(localStorage);
    localStorageKeys.forEach((key) => {
        if (
            key.includes("supabase") ||
            key.includes("auth") ||
            key.includes("session") ||
            key.includes("token")
        ) {
            console.log(`  Removing localStorage key: ${key}`);
            localStorage.removeItem(key);
        }
    });

    // 2. Clear all sessionStorage
    console.log("📦 Clearing sessionStorage...");
    const sessionStorageKeys = Object.keys(sessionStorage);
    sessionStorageKeys.forEach((key) => {
        if (
            key.includes("supabase") ||
            key.includes("auth") ||
            key.includes("session") ||
            key.includes("token")
        ) {
            console.log(`  Removing sessionStorage key: ${key}`);
            sessionStorage.removeItem(key);
        }
    });

    // 3. Clear all cookies
    console.log("🍪 Clearing cookies...");
    const cookies = document.cookie.split(";");
    cookies.forEach((cookie) => {
        const [name] = cookie.split("=");
        const trimmedName = name.trim();

        if (
            trimmedName.includes("supabase") ||
            trimmedName.includes("auth") ||
            trimmedName.includes("sb-") ||
            trimmedName.includes("session")
        ) {
            console.log(`  Removing cookie: ${trimmedName}`);
            
            // Clear for current domain and all paths
            document.cookie = `${trimmedName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            document.cookie = `${trimmedName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
            
            // Try with leading dot for subdomain clearing
            const domain = window.location.hostname;
            if (domain !== "localhost") {
                document.cookie = `${trimmedName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${domain};`;
            }
        }
    });

    // 4. Clear IndexedDB (some browsers might use this)
    console.log("💾 Clearing IndexedDB...");
    if (window.indexedDB && window.indexedDB.databases) {
        window.indexedDB.databases().then((databases) => {
            databases.forEach((db) => {
                if (
                    db.name &&
                    (db.name.includes("supabase") || db.name.includes("auth"))
                ) {
                    console.log(`  Deleting IndexedDB: ${db.name}`);
                    window.indexedDB.deleteDatabase(db.name);
                }
            });
        });
    }

    console.log("✅ Auth data cleared successfully!");
    console.log("🔄 Redirecting to login page in 2 seconds...");

    // Redirect to login page after 2 seconds
    setTimeout(() => {
        window.location.href = "/login";
    }, 2000);
})();
