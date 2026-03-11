/**
 * White-label config — đổi domain/branding tại đây hoặc qua env vars.
 *
 * Env vars (set trong .env.local hoặc hosting):
 *   NEXT_PUBLIC_AI_BASE_URL   — endpoint AI (mặc định: https://ezaiapi.com)
 *   NEXT_PUBLIC_BRAND_NAME    — tên thương hiệu hiển thị (mặc định: 2brain)
 *   NEXT_PUBLIC_BRAND_DOMAIN  — domain website chính (mặc định: same as AI base URL)
 */

export const aiBaseUrl: string =
  process.env.NEXT_PUBLIC_AI_BASE_URL ?? 'https://ezaiapi.com'

export const resellerApiBase: string = `${aiBaseUrl}/reseller/api`

export const brandName: string =
  process.env.NEXT_PUBLIC_BRAND_NAME ?? '2brain'

export const brandDomain: string =
  process.env.NEXT_PUBLIC_BRAND_DOMAIN ?? aiBaseUrl
