import type { SupabaseClient } from '@supabase/supabase-js'

export type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE'

type AuditRow = {
  id: string
  shop_id: string
  user_id: string | null
  user_email: string | null
  table_name: string
  record_id: string
  action: AuditAction
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  created_at: string
}

export interface AuditLog {
  id: string
  shopId: string
  userId: string | null
  userEmail: string | null
  tableName: string
  recordId: string
  action: AuditAction
  oldData: Record<string, unknown> | null
  newData: Record<string, unknown> | null
  createdAt: string
}

export async function loadAuditLogs(supabase: SupabaseClient, shopId: string): Promise<AuditLog[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return ((data || []) as AuditRow[]).map((row) => ({
    id: row.id,
    shopId: row.shop_id,
    userId: row.user_id,
    userEmail: row.user_email,
    tableName: row.table_name,
    recordId: row.record_id,
    action: row.action,
    oldData: row.old_data,
    newData: row.new_data,
    createdAt: row.created_at,
  }))
}

export const demoAuditLogs: AuditLog[] = []
