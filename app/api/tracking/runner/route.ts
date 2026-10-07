import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: runner, error } = await supabase
      .from('runners')
      .select('id, full_name, team_id, relay_order')
      .eq('tracking_token_hash', token)
      .single()

    if (error || !runner) {
      return NextResponse.json({ error: 'Runner not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, runner })
  } catch (error: any) {
    console.error('Error fetching runner:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
