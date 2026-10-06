'use client'

import { useState } from 'react'
import { generateRunnerToken } from '@/lib/quick-actions'
import { Button } from '@/components/ui/button'
import { Loader2, Link as LinkIcon, Check } from 'lucide-react'

export function RunnerTokenButton({ runnerId, token }: { runnerId: string, token: string | null }) {
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    await generateRunnerToken(runnerId)
    setLoading(false)
  }

  const handleCopy = () => {
    const url = `${window.location.origin}/tracking/${token}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (token) {
    return (
      <Button size="sm" variant="outline" onClick={handleCopy} className="h-8 text-xs flex gap-2">
        {copied ? <Check className="h-3 w-3 text-green-500" /> : <LinkIcon className="h-3 w-3" />}
        Copy GPS Link
      </Button>
    )
  }

  return (
    <Button size="sm" onClick={handleGenerate} disabled={loading} className="h-8 text-xs">
      {loading ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : null}
      Generate Link
    </Button>
  )
}
