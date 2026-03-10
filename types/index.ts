// Types for 2brain reseller app

export type UserRole = 'admin' | 'user'

export interface RbUser {
  id: string
  role: UserRole
  name: string | null
  ezai_user_id: string | null
  ezai_api_key: string | null
  user_code: string | null
  leverage: number
  created_at: string
  updated_at: string
}

export type TopupStatus = 'pending' | 'approved' | 'rejected'
export type TopupType = 'credit' | 'plan'

export interface TopupRequest {
  id: string
  user_id: string
  vnd_amount: number
  usd_amount: number
  credit_amount: number
  exchange_rate: number
  leverage: number
  transfer_content: string
  status: TopupStatus
  type: TopupType
  plan_name: string | null
  admin_note: string | null
  approved_by: string | null
  approved_at: string | null
  created_at: string
  // joined
  rb_users?: Pick<RbUser, 'name' | 'user_code'>
}

export interface Settings {
  exchange_rate: number
  user_leverage: number
  bank_account: string
  bank_name: string
  bank_holder: string
  bank_bin: string
}

export interface EzaiApiKey {
  id: string
  prefix: string
  full_key: string
  name: string
  is_active: number
  created_at: string
  last_used_at: string | null
}

export interface EzaiUser {
  id: string
  email: string
  name: string
  balance: number
  plan_type: string
  daily_limit: number
  daily_used: number
  plan_expires_at: string | null
  created_at: string
  last_login_at: string | null
  // Returned only from GET /reseller/api/users/:id
  active_plans?: unknown[]
  api_keys?: EzaiApiKey[]
}

export interface EzaiTransaction {
  id: string
  end_user_id: string
  type: string
  amount: number
  original_amount?: number
  discount_percent?: number
  status: string
  failure_reason?: string | null
  description: string
  created_at: string
}

export interface UsageData {
  balance: number
  plan_type: string
  daily_limit: number
  daily_used: number
  plan_expires_at: string | null
  transactions: EzaiTransaction[]
  monthly_topup_vnd: number
  monthly_topup_credit: number
}

export interface AdminUserStat {
  rb_user_id: string
  name: string | null
  email: string
  ezai_user_id: string | null
  balance: number
  plan_type: string
  daily_limit: number
  daily_used: number
  plan_expires_at: string | null
}

export interface EzaiStats {
  total_users: number
  reseller_balance: number
  reseller_quota: number
  bonus_multiplier: number
  total_transactions: number
  total_topups: number
  total_plan_activations: number
}

export interface EzaiUsageLog {
  id: string
  user_id: string
  model: string
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  cost: number
  created_at: string
}
