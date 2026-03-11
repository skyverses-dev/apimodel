import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import { User } from '@/lib/db/models'
import { hashPassword } from '@/lib/auth/password'
import { signToken } from '@/lib/auth/jwt'
import { setSession } from '@/lib/auth/session'
import { ezai } from '@/lib/ezai/client'

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

        // Auto-provision EzAI account (non-blocking)
        try {
            const ezaiUser = await ezai.createUser(user.email, user.name || user.email)
            await User.findByIdAndUpdate(user._id, {
                ezai_user_id: ezaiUser.id,
                ezai_api_key: ezaiUser.api_key,
            })
        } catch (ezaiErr: unknown) {
            // If email already exists on EzAI, try to link
            const msg = ezaiErr instanceof Error ? ezaiErr.message.toLowerCase() : ''
            if (msg.includes('already') || msg.includes('exist') || msg.includes('duplicate')) {
                try {
                    const { users } = await ezai.listUsers(1, 200)
                    const existing = users.find(u => u.email === user.email)
                    if (existing) {
                        const full = await ezai.getUser(existing.id)
                        const key = full.api_keys?.find(k => k.is_active === 1)?.full_key || full.api_keys?.[0]?.full_key || ''
                        await User.findByIdAndUpdate(user._id, {
                            ezai_user_id: existing.id,
                            ezai_api_key: key,
                        })
                    }
                } catch { /* silently skip linking */ }
            } else {
                console.error('EzAI auto-provision failed:', ezaiErr)
            }
        }

        return NextResponse.json({ success: true, user: user.toJSON() })
    } catch (error) {
        console.error('Register error:', error)
        return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
    }
}
