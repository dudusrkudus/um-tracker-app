export type RunnerOption = {
  id: string
  full_name: string
  relay_order: number
  status: string
}

export type TeamOption = {
  id: string
  team_code: string
  team_name: string
  status: string
  runners: RunnerOption[]
  /** Highest checkpoint sequence already logged for this team, if any. */
  last_sequence: number | null
}

export type CheckpointOption = {
  id: string
  code: string
  name: string
  sequence_no: number
}

export type ProfileOption = {
  id: string
  full_name: string
  role: string
}

export function activeRunner(team: TeamOption | undefined): RunnerOption | undefined {
  if (!team) return undefined
  return (
    team.runners.find((r) => r.status === 'running') ??
    [...team.runners].sort((a, b) => a.relay_order - b.relay_order).find((r) => r.status === 'not_started')
  )
}

export function nextRunner(team: TeamOption | undefined, current?: RunnerOption): RunnerOption | undefined {
  if (!team || !current) return undefined
  return [...team.runners]
    .sort((a, b) => a.relay_order - b.relay_order)
    .find((r) => r.relay_order > current.relay_order && r.status !== 'completed_leg')
}

export function suggestedCheckpoint(team: TeamOption | undefined, checkpoints: CheckpointOption[]) {
  if (!team) return undefined
  const sorted = [...checkpoints].sort((a, b) => a.sequence_no - b.sequence_no)
  if (team.last_sequence === null) return sorted[0]
  return sorted.find((c) => c.sequence_no > team.last_sequence!) ?? sorted[sorted.length - 1]
}

export function runnerLabel(r: RunnerOption) {
  return `#${r.relay_order} ${r.full_name}${r.status === 'running' ? ' (aktif)' : ''}`
}
