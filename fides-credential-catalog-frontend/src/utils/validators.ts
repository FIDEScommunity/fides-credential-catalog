export function hasText(value: string | undefined) {
    return (value !== undefined && value !== '');
}

export function isValidUrl(value: string | undefined) {
    if (value === undefined || value === '') {
        return true;
    }
    let url;
    try {
        url = new URL(value);
    } catch (_) {
        return false;
    }

    return url.protocol === "http:" || url.protocol === "https:";
}

const emailRegex: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isValidEmail = (email: string): boolean => {
    return emailRegex.test(email);
};
