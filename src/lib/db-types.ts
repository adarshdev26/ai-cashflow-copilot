import type { prisma } from '@/lib/prisma'

/** The transaction client passed to prisma.$transaction(async (tx) => ...). */
export type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]