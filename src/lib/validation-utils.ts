/**
 * Utility functions for form validation
 * Centralized validation logic for consistent validation across the application
 */

/**
 * Email validation regex
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Password validation rules
 */
export interface PasswordValidation {
    isValid: boolean;
    errors: string[];
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
    if (!email || typeof email !== 'string') return false;
    return EMAIL_REGEX.test(email.trim());
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): PasswordValidation {
    const errors: string[] = [];
    
    if (!password || password.length < 6) {
        errors.push("Mật khẩu phải có ít nhất 6 ký tự");
    }
    
    const minLength = password.length >= 6;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (!minLength) errors.push("Mật khẩu phải có ít nhất 6 ký tự");
    if (!hasUppercase) errors.push("Mật khẩu phải có ít nhất 1 chữ hoa");
    if (!hasLowercase) errors.push("Mật khẩu phải có ít nhất 1 chữ thường");
    if (!hasNumber) errors.push("Mật khẩu phải có ít nhất 1 số");
    if (!hasSpecialChar) errors.push("Mật khẩu phải có ít nhất 1 ký tự đặc biệt");
    
    return {
        isValid: errors.length === 0,
        errors,
        minLength,
        hasUppercase,
        hasLowercase,
        hasNumber,
        hasSpecialChar
    };
}

/**
 * Validate required field
 */
export function validateRequired(value: unknown, fieldName: string): string | null {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
        return `${fieldName} là bắt buộc`;
    }
    return null;
}

/**
 * Validate string length
 */
export function validateStringLength(value: string, min: number, max?: number, fieldName?: string): string | null {
    if (!value) return null;
    
    if (value.length < min) {
        return `${fieldName || 'Trường này'} phải có ít nhất ${min} ký tự`;
    }
    
    if (max && value.length > max) {
        return `${fieldName || 'Trường này'} không được vượt quá ${max} ký tự`;
    }
    
    return null;
}

/**
 * Validate URL format
 */
export function validateUrl(url: string): boolean {
    if (!url) return true; // Allow empty URLs
    
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Validate phone number (Vietnamese format)
 */
export function validatePhoneNumber(phone: string): boolean {
    if (!phone) return true; // Allow empty phone numbers
    
    // Vietnamese phone number format: 0xxxxxxxxx or +84xxxxxxxxx
    const phoneRegex = /^(0|\+84)[0-9]{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Validate date format (YYYY-MM-DD)
 */
export function validateDateFormat(date: string): boolean {
    if (!date) return true; // Allow empty dates
    
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;
    
    const dateObj = new Date(date);
    return !isNaN(dateObj.getTime());
}

/**
 * Validate datetime format (YYYY-MM-DDTHH:mm)
 */
export function validateDateTimeFormat(datetime: string): boolean {
    if (!datetime) return true; // Allow empty datetime
    
    const datetimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
    if (!datetimeRegex.test(datetime)) return false;
    
    const dateObj = new Date(datetime + ":00");
    return !isNaN(dateObj.getTime());
}

/**
 * Get validation error message for common fields
 */
export function getFieldErrorMessage(fieldName: string, value: unknown, rules: {
    required?: boolean;
    email?: boolean;
    minLength?: number;
    maxLength?: number;
    url?: boolean;
    phone?: boolean;
    date?: boolean;
    datetime?: boolean;
}): string | null {
    // Required validation
    if (rules.required) {
        const requiredError = validateRequired(value, fieldName);
        if (requiredError) return requiredError;
    }
    
    // Skip other validations if value is empty and not required
    if (!value || (typeof value === 'string' && value.trim() === '')) {
        return null;
    }
    
    // Email validation
    if (rules.email && typeof value === 'string' && !validateEmail(value)) {
        return "Email không hợp lệ";
    }
    
    // Length validation
    if (typeof value === 'string') {
        if (rules.minLength) {
            const lengthError = validateStringLength(value, rules.minLength, rules.maxLength, fieldName);
            if (lengthError) return lengthError;
        }
    }
    
    // URL validation
    if (rules.url && typeof value === 'string' && !validateUrl(value)) {
        return "URL không hợp lệ";
    }
    
    // Phone validation
    if (rules.phone && typeof value === 'string' && !validatePhoneNumber(value)) {
        return "Số điện thoại không hợp lệ";
    }
    
    // Date validation
    if (rules.date && typeof value === 'string' && !validateDateFormat(value)) {
        return "Định dạng ngày không hợp lệ (YYYY-MM-DD)";
    }
    
    // Datetime validation
    if (rules.datetime && typeof value === 'string' && !validateDateTimeFormat(value)) {
        return "Định dạng ngày giờ không hợp lệ (YYYY-MM-DDTHH:mm)";
    }
    
    return null;
} 