export function generateVietQRUrl({
  bankBin,
  accountNumber,
  accountName,
  amount,
  description,
}: {
  bankBin: string
  accountNumber: string
  accountName: string
  amount: number
  description: string
}): string {
  const params = new URLSearchParams({
    amount: Math.round(amount).toString(),
    addInfo: description,
    accountName,
  })
  return `https://img.vietqr.io/image/${bankBin}-${accountNumber}-compact2.png?${params}`
}
