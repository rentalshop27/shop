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

export const demoAuditLogs: AuditLog[] = [
  {
    id: '1',
    shopId: 'shop_demo',
    userId: 'user_demo_1',
    userEmail: 'admin@preciousrental.com',
    tableName: 'customers',
    recordId: 'c1',
    action: 'UPDATE',
    oldData: {
      full_name: 'คุณวิภาวี ศรีสุข',
      phone: '0812345678',
      line_account: 'wipa_v',
      bust_in: 34,
      waist_in: 26,
      hip_in: 36
    },
    newData: {
      full_name: 'คุณวิภาวี ศรีสุขใจ',
      phone: '0812345678',
      line_account: 'wipavee.sj',
      bust_in: 34.5,
      waist_in: 26,
      hip_in: 36.5
    },
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 mins ago
  },
  {
    id: '2',
    shopId: 'shop_demo',
    userId: 'user_demo_2',
    userEmail: 'staff@preciousrental.com',
    tableName: 'customers',
    recordId: 'c2',
    action: 'INSERT',
    oldData: null,
    newData: {
      full_name: 'คุณสมศักดิ์ รักไทย',
      phone: '0912345678',
      phone_normalized: '0912345678',
      profile_status: 'incomplete',
      risk_flag: 'none'
    },
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 mins ago
  },
  {
    id: '3',
    shopId: 'shop_demo',
    userId: 'user_demo_1',
    userEmail: 'admin@preciousrental.com',
    tableName: 'customer_documents',
    recordId: 'd1',
    action: 'DELETE',
    oldData: {
      id: 'd1',
      customer_id: 'c1',
      storage_path: 'shop_demo/c1/photo-old.jpg',
      sort_order: 1
    },
    newData: null,
    createdAt: new Date(Date.now() - 1.5 * 3600 * 1000).toISOString(), // 1.5 hours ago
  },
  {
    id: '4',
    shopId: 'shop_demo',
    userId: 'user_demo_2',
    userEmail: 'staff@preciousrental.com',
    tableName: 'rentals',
    recordId: 'r1',
    action: 'UPDATE',
    oldData: {
      status: 'booked',
      collected_amount: 1500
    },
    newData: {
      status: 'active',
      collected_amount: 2500
    },
    createdAt: new Date(Date.now() - 2.5 * 3600 * 1000).toISOString(), // 2.5 hours ago
  }
]
