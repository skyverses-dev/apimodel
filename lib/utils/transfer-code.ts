/**
 * Generate unique transfer content for bank transfer
 * 
 * Credit format:  "2BRAIN CR U0002 R7A3F1B9C2"
 * Plan format:    "2BRAIN PL STARTER U0002 R7A3F1B9C2"
 * 
 * - CR = credit topup, PL = plan subscription
 * - 10-char random hex for uniqueness + anti-spam
 */
export function generateTransferContent(
  userCode: string,
  type: 'credit' | 'plan' = 'credit',
  planName?: string
): string {
  const rand = Math.random().toString(16).slice(2, 12).toUpperCase().padEnd(10, '0')

  if (type === 'plan' && planName) {
    return `2BRAIN PL ${planName.toUpperCase()} ${userCode} R${rand}`
  }

  return `2BRAIN CR ${userCode} R${rand}`
}
