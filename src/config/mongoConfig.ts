import mongoose from "mongoose"

mongoose.Promise = Promise

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/torder"

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache:
    | {
        conn: typeof mongoose | null
        promise: Promise<typeof mongoose> | null
      }
    | undefined
}

const cached = global.mongooseCache ?? { conn: null, promise: null }
if (!global.mongooseCache) {
  global.mongooseCache = cached
}

const mongoServer = async (): Promise<typeof mongoose> => {
  if (cached.conn?.connection?.readyState === 1) {
    return cached.conn
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGO_URI)
      .then((instance) => {
        cached.conn = instance
        if (process.env.NODE_ENV === "development") {
          console.log("MongoDB connected")
        }
        return instance
      })
      .catch((error) => {
        cached.promise = null
        console.error("MongoDB connection error:", error)
        throw error
      })
  }

  cached.conn = await cached.promise
  return cached.conn
}

export default mongoServer
