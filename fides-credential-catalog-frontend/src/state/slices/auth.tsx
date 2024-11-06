export function bearerAuth(token: string | undefined) {
    return `Bearer ${token}`
}
