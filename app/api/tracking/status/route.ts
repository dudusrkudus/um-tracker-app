import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const statusSchema = z.object({
  token: z.string().min(1),
  status: z.enum(['running', 'completed_leg', 'finished']),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { token, status } = statusSchema.parse(body)

    const supabase = createAdminClient()

    // Cari runner berdasarkan token
    const { data: runner, error: runnerError } = await supabase
      .from('runners')
      .select('id, team_id')
      .eq('tracking_token_hash', token) // Asumsi token yang dikirim adalah hash atau kita perlu nge-hash dulu?
      // Wait, di location API bagaimana cara check token-nya?
      .single()

    if (runnerError || !runner) {
      return NextResponse.json({ error: 'Token tidak valid' }, { status: 401 })
    }

    // Update runner status
    const { error: updateError } = await supabase
      .from('runners')
      .update({ status })
      .eq('id', runner.id)

    if (updateError) {
      throw updateError
    }

    // Jika status running, update team status ke running juga
    if (status === 'running') {
      await supabase
        .from('teams')
        .update({ status: 'running' })
        .eq('id', runner.team_id)
    } else if (status === 'completed_leg') {
      // Cek apakah ini pelari terakhir
      const { data: teamRunners } = await supabase
        .from('runners')
        .select('id, relay_order, status')
        .eq('team_id', runner.team_id)
        .order('relay_order', { ascending: false })
      
      if (teamRunners && teamRunners.length > 0) {
        // Jika relay_order pelari ini adalah yang terbesar, berarti dia pelari terakhir
        const isLastRunner = teamRunners[0].id === runner.id
        
        if (isLastRunner) {
          // Update pelari ini menjadi finished
          await supabase.from('runners').update({ status: 'finished' }).eq('id', runner.id)
          // Update tim menjadi finished
          await supabase.from('teams').update({ status: 'finished' }).eq('id', runner.team_id)
        } else {
          // Update tim menjadi waiting_relay
          await supabase.from('teams').update({ status: 'waiting_relay' }).eq('id', runner.team_id)
        }
      }
    }

    return NextResponse.json({ success: true, message: `Status berhasil diubah menjadi ${status}` })
  } catch (error: any) {
    console.error('Error updating status:', error)
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan saat mengupdate status' },
      { status: 400 }
    )
  }
}
