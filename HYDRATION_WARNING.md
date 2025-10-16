# Hydration Warning - bis_skin_checked

## Issue
Browser shows hydration mismatch warning with `bis_skin_checked="1"` attribute.

## Root Cause
**Browser extension** (likely Bitwarden, LastPass, or similar password manager) is injecting attributes into the DOM.

## Impact
- ⚠️ Warning only - **NOT a bug in your code**
- ✅ Does NOT affect functionality
- ✅ Does NOT affect user creation
- ✅ Only appears in development

## Solution Options

### Option 1: Ignore (Recommended)
This is a harmless warning. Just ignore it.

### Option 2: Suppress Warning
Add to `next.config.ts`:

```typescript
const nextConfig = {
  // ... existing config
  
  // Suppress hydration warnings in development
  reactStrictMode: true,
  
  // Optional: Custom error handling
  onError: (error) => {
    if (error.message.includes('bis_skin_checked')) {
      // Suppress Bitwarden/extension warnings
      return;
    }
    console.error(error);
  }
};
```

### Option 3: Test Without Extensions
1. Open browser in **Incognito/Private mode**
2. Test the app
3. Warning should disappear

### Option 4: Disable Extension
Temporarily disable Bitwarden or password manager extensions while developing.

## Why This Happens

Browser extensions like Bitwarden add attributes to DOM elements to:
- Track password fields
- Identify form inputs
- Add autofill functionality

These attributes are added AFTER React hydrates the DOM, causing a mismatch warning.

## Related Extensions That Cause This:
- Bitwarden (`bis_skin_checked`)
- LastPass
- 1Password
- Grammarly
- Dark Reader
- Any extension that modifies DOM

## Verification

Check if extension is the cause:
```javascript
// In browser console
document.querySelector('[bis_skin_checked]')
// If returns element, Bitwarden is active
```

## Important
**This warning is NOT related to the "user not allowed" error!**

Focus on checking user role with `/api/debug/whoami` instead.
