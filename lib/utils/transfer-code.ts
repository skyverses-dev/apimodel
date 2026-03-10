export function generateTransferContent(userCode: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return `2BRAIN ${userCode} ${date}`
}
