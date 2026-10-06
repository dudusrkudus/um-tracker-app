'use client'

import { useState } from 'react'
import { Flag, Repeat } from 'lucide-react'
import { CheckpointLogForm } from './checkpoint-log-form'
import { RelayChangeForm } from './relay-change-form'
import type { CheckpointOption, TeamOption } from './types'

const TABS = [
  { key: 'checkpoint', label: 'Checkpoint', Icon: Flag },
  { key: 'relay', label: 'Pergantian relay', Icon: Repeat },
] as const

export function CheckpointEntryPanel({
  teams,
  checkpoints,
}: {
  teams: TeamOption[]
  checkpoints: CheckpointOption[]
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('checkpoint')

  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Jenis pencatatan" className="inline-flex w-full rounded-lg bg-muted p-1 sm:w-auto">
        {TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            id={`tab-${key}`}
            role="tab"
            type="button"
            aria-selected={tab === key}
            aria-controls={`panel-${key}`}
            onClick={() => setTab(key)}
            className={
              'flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors sm:flex-none ' +
              (tab === key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')
            }
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </button>
        ))}
      </div>

      {/* Both panels stay mounted so in-progress input is not lost when switching */}
      <div id="panel-checkpoint" role="tabpanel" aria-labelledby="tab-checkpoint" hidden={tab !== 'checkpoint'}>
        <CheckpointLogForm teams={teams} checkpoints={checkpoints} />
      </div>
      <div id="panel-relay" role="tabpanel" aria-labelledby="tab-relay" hidden={tab !== 'relay'}>
        <RelayChangeForm teams={teams} checkpoints={checkpoints} />
      </div>
    </div>
  )
}
