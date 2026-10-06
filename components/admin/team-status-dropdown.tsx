'use client'

import { useState } from 'react'
import { updateTeamStatus } from '@/lib/quick-actions'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

export function TeamStatusDropdown({ teamId, currentStatus }: { teamId: string, currentStatus: string }) {
  const [loading, setLoading] = useState(false)

  const handleStatusChange = async (newStatus: string | null) => {
    if (!newStatus) return
    setLoading(true)
    await updateTeamStatus(teamId, newStatus)
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
          <SelectItem value="checked_in">CHECKED IN</SelectItem>
          <SelectItem value="running">RUNNING</SelectItem>
          <SelectItem value="waiting_relay">WAITING RELAY</SelectItem>
          <SelectItem value="resting">RESTING</SelectItem>
          <SelectItem value="attention">ATTENTION</SelectItem>
          <SelectItem value="emergency">EMERGENCY</SelectItem>
          <SelectItem value="finished">FINISHED</SelectItem>
          <SelectItem value="dnf">DNF</SelectItem>
          <SelectItem value="unknown">UNKNOWN</SelectItem>
        </SelectContent>
      </Select>
      {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-500" />}
    </div>
  )
}
