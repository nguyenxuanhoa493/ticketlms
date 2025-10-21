/**
 * Quick script to clear all auth data
 * Can be bookmarked or run from browser console
 * 
 * Usage:
 * 1. Open browser console (F12)
 * 2. Paste this entire script
 * 3. Press Enter
 * 
 * Or access directly: http://localhost:3000/clear-auth.js
 */

console.log("🔄 Clearing all authentication data...");

// Clear localStorage
Object.keys(localStorage).forEach(key => {
    if (key.includes('supabase') || key.includes('auth') || key.includes('sb-')) {
        console.log(`Removing localStorage: ${key}`);
        localStorage.removeItem(key);
    }
});

// Clear sessionStorage
Object.keys(sessionStorage).forEach(key => {
    if (key.includes('supabase') || key.includes('auth') || key.includes('sb-')) {
        console.log(`Removing sessionStorage: ${key}`);
        sessionStorage.removeItem(key);
    }
});

// Clear cookies
document.cookie.split(";").forEach(cookie => {
    const name = cookie.split("=")[0].trim();
    if (name.includes('supabase') || name.includes('auth') || name.includes('sb-')) {
        console.log(`Removing cookie: ${name}`);
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
});

console.log("✅ Auth data cleared! Redirecting to login...");
setTimeout(() => window.location.href = "/login", 1000);
