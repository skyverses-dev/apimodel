import { cookies } from 'next/headers'
import { verifyToken, type TokenPayload } from './jwt'

const COOKIE_NAME = '2brain_token'
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 // 7 days in seconds

export async function setSession(token: string) {
    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: COOKIE_MAX_AGE,
    })
}

export async function getSession(): Promise<TokenPayload | null> {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (!token) return null
    return verifyToken(token)
}

export async function clearSession() {
    const cookieStore = await cookies()
    cookieStore.delete(COOKIE_NAME)
}

export { COOKIE_NAME }
