import { EzaiUser, EzaiTransaction, EzaiApiKey, EzaiStats, EzaiUsageLog } from '@/types'

const BASE = process.env.EZAI_BASE_URL || 'https://ezaiapi.com'
const KEY = process.env.EZAI_RESELLER_KEY!

async function ezaiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `EzAI error ${res.status}`)
  }
  return res.json()
}

export const ezai = {
  // List all end-users
  async listUsers(page = 1, limit = 50): Promise<{ users: EzaiUser[]; total: number }> {
    return ezaiFetch(`/reseller/api/users?page=${page}&limit=${limit}`)
  },

  // Get single user by ezai_user_id (returns active_plans + api_keys)
  async getUser(ezaiUserId: string): Promise<EzaiUser> {
    return ezaiFetch(`/reseller/api/users/${ezaiUserId}`)
  },

  // Create a new API key for a user
  async createApiKey(ezaiUserId: string, name = 'Default Key'): Promise<EzaiApiKey> {
    return ezaiFetch(`/reseller/api/users/${ezaiUserId}/keys`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    })
  },

  // Create a new end-user
  async createUser(email: string, name: string): Promise<EzaiUser & { api_key: string }> {
    return ezaiFetch('/reseller/api/users', {
      method: 'POST',
      body: JSON.stringify({ email, name }),
    })
  },

  // Top-up user balance (amount in USD)
  async topupUser(ezaiUserId: string, amount: number): Promise<{ success: boolean }> {
    return ezaiFetch(`/reseller/api/users/${ezaiUserId}/topup`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    })
  },

  // Activate monthly plan
  async activatePlan(ezaiUserId: string, plan: 'starter' | 'pro' | 'max' | 'ultra'): Promise<{ success: boolean }> {
    return ezaiFetch(`/reseller/api/users/${ezaiUserId}/plan`, {
      method: 'POST',
      body: JSON.stringify({ plan }),
    })
  },

  // Deactivate/delete user
  async deleteUser(ezaiUserId: string): Promise<{ success: boolean }> {
    return ezaiFetch(`/reseller/api/users/${ezaiUserId}`, { method: 'DELETE' })
  },

  // Get transactions, optionally filtered by end_user_id
  async getTransactions(endUserId?: string, limit = 20): Promise<{ transactions: EzaiTransaction[] }> {
    const params = new URLSearchParams({ limit: String(limit) })
    if (endUserId) params.set('end_user_id', endUserId)
    return ezaiFetch(`/reseller/api/transactions?${params}`)
  },

  // Delete (deactivate) a specific API key
  async deleteApiKey(ezaiUserId: string, keyId: string): Promise<{ success: boolean }> {
    return ezaiFetch(`/reseller/api/users/${ezaiUserId}/keys/${keyId}`, { method: 'DELETE' })
  },

  // Reset (regenerate) a specific API key
  async resetApiKey(ezaiUserId: string, keyId: string): Promise<{ key_id: string; api_key: string; prefix: string }> {
    return ezaiFetch(`/reseller/api/users/${ezaiUserId}/keys/${keyId}/reset`, { method: 'POST' })
  },

  // Cancel a user's monthly plan (no refund)
  async cancelPlan(ezaiUserId: string): Promise<{ success: boolean; message: string }> {
    return ezaiFetch(`/reseller/api/users/${ezaiUserId}/plan`, { method: 'DELETE' })
  },

  // Get reseller dashboard stats
  async getStats(): Promise<EzaiStats> {
    return ezaiFetch('/reseller/api/stats')
  },

  // Get usage logs, optionally filtered by user_id
  async getUsage(userId?: string, limit = 50): Promise<{ usage: EzaiUsageLog[] }> {
    const params = new URLSearchParams({ limit: String(limit) })
    if (userId) params.set('user_id', userId)
    return ezaiFetch(`/reseller/api/usage?${params}`)
  },
}
