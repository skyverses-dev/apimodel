import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import { User } from '@/lib/db/models'
import { verifyPassword } from '@/lib/auth/password'
import { signToken } from '@/lib/auth/jwt'
import { setSession } from '@/lib/auth/session'

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json()

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
        }

        await connectDB()

        // Find user (need to explicitly select password since it's excluded from toJSON)
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password')
        if (!user) {
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
        }

        // Verify password
        const valid = await verifyPassword(password, user.password)
        if (!valid) {
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
        }

        // Create JWT & set cookie
        const token = await signToken({
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
        })
        await setSession(token)

        return NextResponse.json({ success: true, user: user.toJSON() })
    } catch (error) {
        console.error('Login error:', error)
        return NextResponse.json({ error: 'Login failed' }, { status: 500 })
    }
}
