'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Check, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/browser'

export function ExportGpsButton({ teamId, teamCode }: { teamId: string, teamCode: string }) {
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: runners, error } = await supabase
        .from('runners')
        .select('full_name, relay_order, tracking_token_hash')
        .eq('team_id', teamId)
        .order('relay_order', { ascending: true })

      if (error) throw error

      if (!runners || runners.length === 0) {
        alert('Tidak ada pelari di tim ini.')
        return
      }

      const baseUrl = window.location.origin
      const lines = runners.map((r) => {
        const link = `${baseUrl}/tracking/${r.tracking_token_hash}`
        return `${teamCode} | ${r.full_name} | Pelari #${r.relay_order} | ${link}`
      })

      const textToCopy = `GPS Tracking Links - ${teamCode}\n\n${lines.join('\n')}`
      
      await navigator.clipboard.writeText(textToCopy)
      
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err: any) {
      alert('Gagal mengambil data: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleExport} 
      disabled={loading}
      className="h-8 text-xs font-semibold"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
      ) : copied ? (
        <Check className="w-4 h-4 mr-1.5 text-green-600" />
      ) : (
        <Copy className="w-4 h-4 mr-1.5" />
      )}
      {copied ? 'Tersalin!' : 'Export GPS Links'}
    </Button>
  )
}
