import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import { User } from '@/lib/db/models'
import { hashPassword } from '@/lib/auth/password'
import { signToken } from '@/lib/auth/jwt'
import { setSession } from '@/lib/auth/session'

export async function POST(request: Request) {
    try {
        const { email, password, name } = await request.json()

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
        }

        await connectDB()

        // Check if user already exists
        const existing = await User.findOne({ email: email.toLowerCase() })
        if (existing) {
            return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
        }

        // Create user
        const hashed = await hashPassword(password)
        const user = await User.create({
            email: email.toLowerCase(),
            password: hashed,
            name: name || email.split('@')[0],
            role: 'user',
        })

        // Create JWT & set cookie
        const token = await signToken({
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
        })
        await setSession(token)

        return NextResponse.json({ success: true, user: user.toJSON() })
    } catch (error) {
        console.error('Register error:', error)
        return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
    }
}
