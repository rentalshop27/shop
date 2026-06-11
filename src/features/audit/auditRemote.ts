import type { SupabaseClient } from '@supabase/supabase-js'

export interface AuditLog {
  id: string
  shopId: string
  userId: string | null
  userEmail: string | null
  tableName: string
  recordId: string
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  oldData: Record<string, any> | null
  newData: Record<string, any> | null
  createdAt: string
}

export async function loadAuditLogs(supabase: SupabaseClient): Promise<AuditLog[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data || []).map((row: any) => ({
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
