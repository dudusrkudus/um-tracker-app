'use client'

import { useState } from 'react'
import { updateRunnerStatus } from '@/lib/quick-actions'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

export function RunnerStatusDropdown({ runnerId, currentStatus }: { runnerId: string, currentStatus: string }) {
  const [loading, setLoading] = useState(false)

  const handleStatusChange = async (newStatus: string | null) => {
    if (!newStatus) return
    setLoading(true)
    await updateRunnerStatus(runnerId, newStatus)
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-2">
      <Select defaultValue={currentStatus} onValueChange={handleStatusChange} disabled={loading}>
        <SelectTrigger className="w-[140px] h-8 text-xs font-semibold uppercase">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="not_started">NOT STARTED</SelectItem>
          <SelectItem value="running">RUNNING</SelectItem>
          <SelectItem value="completed_leg">COMPLETED LEG</SelectItem>
          <SelectItem value="waiting_relay">WAITING RELAY</SelectItem>
          <SelectItem value="resting">RESTING</SelectItem>
          <SelectItem value="injured">INJURED</SelectItem>
          <SelectItem value="evacuated">EVACUATED</SelectItem>
          <SelectItem value="not_detected">NOT DETECTED</SelectItem>
          <SelectItem value="finished">FINISHED</SelectItem>
        </SelectContent>
      </Select>
      {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-500" />}
    </div>
  )
}
