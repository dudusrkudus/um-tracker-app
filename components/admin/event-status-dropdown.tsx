'use client'

import { useState } from 'react'
import { updateEventStatus } from '@/lib/quick-actions'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

export function EventStatusDropdown({ eventId, currentStatus }: { eventId: string, currentStatus: string }) {
  const [loading, setLoading] = useState(false)

  const handleStatusChange = async (newStatus: string | null) => {
    if (!newStatus) return
    setLoading(true)
    await updateEventStatus(eventId, newStatus)
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-2">
      <Select defaultValue={currentStatus} onValueChange={handleStatusChange} disabled={loading}>
        <SelectTrigger className="w-[120px] h-8 text-xs font-semibold uppercase">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="draft">DRAFT</SelectItem>
          <SelectItem value="ready">READY</SelectItem>
          <SelectItem value="live">LIVE</SelectItem>
          <SelectItem value="paused">PAUSED</SelectItem>
          <SelectItem value="completed">COMPLETED</SelectItem>
          <SelectItem value="cancelled">CANCELLED</SelectItem>
        </SelectContent>
      </Select>
      {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-500" />}
    </div>
  )
}
