export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount)
}

export function formatCredit(amount: number): string {
  return `$${amount.toFixed(4)}`
}

export function vndToUsd(vnd: number, exchangeRate: number): number {
  return vnd / exchangeRate
}

export function usdToCredit(usd: number, leverage: number): number {
  return usd * leverage
}
