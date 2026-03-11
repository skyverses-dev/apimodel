/**
 * Generate unique transfer content for bank transfer
 * Format: 2BRAIN UXXXX RXXXX
 *   - UXXXX = user code
 *   - RXXXX = random 4-char hex (unique per request)
 * 
 * Example: "2BRAIN U0002 RA3F1"
 */
export function generateTransferContent(userCode: string): string {
  const rand = Math.random().toString(16).slice(2, 6).toUpperCase()
  return `2BRAIN ${userCode} R${rand}`
}
