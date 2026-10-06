import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const token = formData.get('token') as string
    const message = formData.get('message') as string
    const photo = formData.get('photo') as File | null

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Verify token
    const { data: runner, error: runnerError } = await supabase
      .from('runners')
      .select('id, team_id, teams ( event_id, status )')
      .eq('tracking_token_hash', token)
      .maybeSingle()

    if (runnerError || !runner) {
      return NextResponse.json({ error: 'Invalid tracking token' }, { status: 401 })
    }

    const team = runner.teams as any

    let photoUrl = null

    // Process photo if it exists
    if (photo && photo.size > 0) {
      const buffer = Buffer.from(await photo.arrayBuffer())
      const fileName = `webgps_${runner.id}_${Date.now()}_${photo.name}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('incidents')
        .upload(fileName, buffer, {
          contentType: photo.type || 'image/jpeg'
        })
        
      if (!uploadError && uploadData) {
        const { data: publicUrlData } = supabase.storage.from('incidents').getPublicUrl(uploadData.path)
        photoUrl = publicUrlData.publicUrl
      } else {
        console.error('Error uploading photo:', uploadError)
      }
    }

    // Insert Incident
    const { error: insertError } = await supabase.from('incidents').insert({
      event_id: team.event_id,
      team_id: runner.team_id,
      runner_id: runner.id,
      type: 'other',
      severity: 'emergency', // Web SOS is usually an emergency
      description: message || 'SOS darurat dikirim dari Web GPS!',
      reported_at: new Date().toISOString(),
      photo_url: photoUrl
    })

    if (insertError) {
      console.error('Insert SOS error:', insertError)
      return NextResponse.json({ error: 'Gagal mengirim SOS' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('SOS API error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
