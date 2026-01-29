import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: Pool | undefined
}

const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  // Reuse existing pool if already created
  if (globalForPrisma.pool && globalForPrisma.prisma) {
    return globalForPrisma.prisma
  }

  const pool = new Pool({
    connectionString,
    max: process.env.NODE_ENV === 'production' ? 20 : 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  })

  const adapter = new PrismaPg(pool)

  const prisma = new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  })

  // Store pool reference for cleanup
  globalForPrisma.pool = pool

  return prisma
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

// Store prisma instance for development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Graceful shutdown
if (typeof global !== 'undefined') {
  process.on('SIGINT', async () => {
    await prisma.$disconnect()
    if (globalForPrisma.pool) {
      await globalForPrisma.pool.end()
    }
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    await prisma.$disconnect()
    if (globalForPrisma.pool) {
      await globalForPrisma.pool.end()
    }
    process.exit(0)
  })
}
