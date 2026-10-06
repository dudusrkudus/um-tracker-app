import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Helper to handle individual Telegram update
async function processUpdate(update: any, supabase: any) {
  const message = update.message
  if (!message) return // We only handle messages
  
  const chatId = message.chat.id
  const telegramUserId = message.from.id
  const text = message.text || ''
  
  // 1. Check if user is already paired (take the most recent one to prevent PGRST116 multiple rows error)
  const { data: pairedRunners } = await supabase
    .from('runners')
    .select('id, team_id, teams ( event_id, status ), is_tracking_enabled')
    .eq('telegram_user_id', telegramUserId)
    .order('updated_at', { ascending: false })
    .limit(1)

  const runner = pairedRunners && pairedRunners.length > 0 ? pairedRunners[0] : null

  // Handle Pairing
  if (text.startsWith('/start ')) {
    const code = text.split(' ')[1]
    if (code) {
      const { data: pairingRunner } = await supabase
        .from('runners')
        .select('id, full_name')
        .or(`telegram_pairing_code.eq.${code},tracking_token_hash.eq.${code}`)
        .maybeSingle()
        
      if (pairingRunner) {
        // Clear old pairing with this telegram account to prevent duplicate telegram_user_id
        await supabase
          .from('runners')
          .update({ telegram_user_id: null, telegram_chat_id: null })
          .eq('telegram_user_id', telegramUserId)

        await supabase
          .from('runners')
          .update({
            telegram_user_id: telegramUserId,
            telegram_chat_id: chatId,
            telegram_pairing_code: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', pairingRunner.id)
        
        await sendTelegramMessage(chatId, `Berhasil terhubung! Halo ${pairingRunner.full_name}. Anda sekarang dapat mengirimkan live location atau melaporkan SOS melalui bot ini.`)
        return
      } else {
        await sendTelegramMessage(chatId, 'Kode pairing tidak valid atau sudah digunakan.')
        return
      }
    }
  }

  if (!runner) {
    await sendTelegramMessage(chatId, 'Anda belum terdaftar. Silakan minta kode pairing dari dashboard admin lalu ketik /start <kode>.')
    return
  }

  // Handle Commands
  if (text === '/status') {
    const teamStatus = (runner.teams as any)?.status
    await sendTelegramMessage(chatId, `Status tim Anda saat ini: ${teamStatus}`)
    return
  }
  
  const isSosCommand = text.startsWith('/sos') || (message.caption || '').startsWith('/sos');
  const isPhoto = !!message.photo;
  const isPlainMessage = text && !text.startsWith('/') && !message.location;

  if (isSosCommand || isPhoto || isPlainMessage) {
    const team = runner.teams as any;
    let photoUrl = null;
    let description = text || message.caption || (isSosCommand ? 'SOS dikirim melalui Telegram!' : 'Laporan dari Telegram');

    if (isPhoto && message.photo.length > 0) {
      try {
        const photo = message.photo[message.photo.length - 1]; // largest
        const token = process.env.TELEGRAM_BOT_TOKEN;
        
        // 1. Get file path
        const fileRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${photo.file_id}`);
        const fileData = await fileRes.json();
        
        if (fileData.ok && fileData.result.file_path) {
          // 2. Download file
          const filePath = fileData.result.file_path;
          const downloadRes = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`);
          const buffer = await downloadRes.arrayBuffer();
          
          // 3. Upload to Supabase Storage
          const fileName = `telegram_${runner.id}_${Date.now()}.jpg`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('incidents')
            .upload(fileName, buffer, {
              contentType: 'image/jpeg'
            });
            
          if (!uploadError && uploadData) {
            const { data: publicUrlData } = supabase.storage.from('incidents').getPublicUrl(uploadData.path);
            photoUrl = publicUrlData.publicUrl;
          } else {
            console.error('Error uploading photo to supabase:', uploadError);
          }
        }
      } catch (err) {
        console.error('Error processing telegram photo:', err);
      }
    }

    await supabase.from('incidents').insert({
      event_id: team.event_id,
      team_id: runner.team_id,
      runner_id: runner.id,
      type: 'other',
      severity: isSosCommand ? 'emergency' : 'medium',
      description: description,
      reported_at: new Date(message.date * 1000).toISOString(),
      photo_url: photoUrl
    });

    if (isSosCommand) {
      await sendTelegramMessage(chatId, '🚨 SOS telah diterima! Tim support akan segera menghubungi Anda.');
    } else {
      await sendTelegramMessage(chatId, '✅ Pesan/Foto Anda telah diterima oleh Admin.');
    }
    return;
  }

  // Handle Location
  if (message.location) {
    if (!runner.is_tracking_enabled) {
      await sendTelegramMessage(chatId, 'Tracking saat ini dinonaktifkan untuk Anda.')
      return
    }

    const team = runner.teams as any
    if (team?.status !== 'running' && team?.status !== 'attention' && team?.status !== 'emergency') {
      await sendTelegramMessage(chatId, 'Lokasi diabaikan karena status tim bukan "running".')
      return
    }

    const recordedAt = new Date(message.date * 1000).toISOString()
    const { latitude, longitude } = message.location
    await supabase.from('runner_locations').insert({
      event_id: team.event_id,
      team_id: runner.team_id,
      runner_id: runner.id,
      latitude,
      longitude,
      source: 'telegram',
      recorded_at: recordedAt
    })
    
    // Update team's last known location
    await supabase
      .from('teams')
      .update({
        last_known_latitude: latitude,
        last_known_longitude: longitude,
        last_location_at: recordedAt,
        last_location_source: 'telegram',
      })
      .eq('id', runner.team_id)
      .or(`last_location_at.is.null,last_location_at.lte.${recordedAt}`)

    // Update runner status to running on first GPS ping
    await supabase
      .from('runners')
      .update({ status: 'running' })
      .eq('id', runner.id)
      .eq('status', 'not_started')

    // We don't always reply to locations to avoid spamming the runner,
    // but for manual /location we could. Let's stay silent for live location.
    return
  }
}

async function sendTelegramMessage(chatId: number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text })
  })
}

export async function POST(request: Request) {
  try {
    const secret = request.headers.get('x-telegram-bot-api-secret-token')
    
    // Validasi Webhook Secret
    if (process.env.TELEGRAM_WEBHOOK_SECRET && secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const update = await request.json()
    if (!update || !update.update_id) {
      return NextResponse.json({ success: true })
    }

    const supabase = createAdminClient()

    // Cegah duplicate update_id
    const { error: insertError } = await supabase
      .from('telegram_updates')
      .insert({ update_id: update.update_id })

    // Jika error (misal duplicate key), abaikan saja (sudah diproses)
    if (insertError) {
      return NextResponse.json({ success: true, message: 'Already processed' })
    }

    // Proses pesan
    await processUpdate(update, supabase)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Telegram Webhook Error:', err)
    // Always return 200 to Telegram so it stops retrying unless we really want a retry
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 200 })
  }
}
