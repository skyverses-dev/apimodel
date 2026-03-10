import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable in .env.local')
}

interface MongooseCache {
    conn: typeof mongoose | null
    promise: Promise<typeof mongoose> | null
}

// Use global cache to prevent multiple connections in dev (hot reload)
const globalWithMongoose = globalThis as typeof globalThis & {
    mongoose: MongooseCache
}

let cached = globalWithMongoose.mongoose

if (!cached) {
    cached = globalWithMongoose.mongoose = { conn: null, promise: null }
}

export async function connectDB() {
    if (cached.conn) return cached.conn

    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, {
            bufferCommands: false,
        })
    }

    try {
        cached.conn = await cached.promise
    } catch (e) {
        cached.promise = null
        throw e
    }

    return cached.conn
}

export default connectDB
