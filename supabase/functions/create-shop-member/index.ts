import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type CreateShopMemberRequest = {
  email?: string
  password?: string
  role?: string
  shopId?: string
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message
  return 'Unexpected error'
}

function isDuplicateUserError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase()
  return message.includes('already been registered')
    || message.includes('already registered')
    || message.includes('user already registered')
    || message.includes('already exists')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, password, role, shopId } = await req.json() as CreateShopMemberRequest

    if (!email || !password || !role || !shopId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (role !== 'manager' && role !== 'staff') {
      return new Response(
        JSON.stringify({ error: 'Invalid role' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Verify caller permissions using their JWT
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized caller' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if the caller is the owner of the shop
    // We can query shop_members directly with the userClient
    const { data: memberData, error: memberError } = await userClient
      .from('shop_members')
      .select('role')
      .eq('shop_id', shopId)
      .eq('user_id', user.id)
      .single()

    if (memberError || !memberData || memberData.role !== 'owner') {
      return new Response(
        JSON.stringify({ error: 'คุณไม่มีสิทธิ์เพิ่มพนักงาน (ต้องเป็นเจ้าของร้านเท่านั้น)' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Create the user using Service Role
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)
    const { data: createdUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (createError || !createdUser.user) {
      const status = isDuplicateUserError(createError) ? 409 : 400
      const message = isDuplicateUserError(createError)
        ? 'อีเมลนี้มีบัญชีอยู่แล้ว กรุณาใช้อีเมลใหม่หรือให้เจ้าของบัญชีเดิมเข้าสู่ระบบเอง'
        : 'ไม่สามารถสร้างบัญชีได้'
      return new Response(
        JSON.stringify({ error: message, details: createError ? getErrorMessage(createError) : '' }),
        { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const newUserId = createdUser.user.id

    // 3. Add to shop_members
    try {
      const { error: insertError } = await adminClient
        .from('shop_members')
        .upsert({ shop_id: shopId, user_id: newUserId, role })

      if (insertError) {
        throw insertError
      }
      
      return new Response(
        JSON.stringify({ success: true, user_id: newUserId }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (insertError: unknown) {
      await adminClient.auth.admin.deleteUser(newUserId)
      return new Response(
        JSON.stringify({ error: 'ไม่สามารถบันทึกสิทธิ์พนักงานได้ กรุณาลองใหม่', details: getErrorMessage(insertError) }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error: unknown) {
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: getErrorMessage(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
