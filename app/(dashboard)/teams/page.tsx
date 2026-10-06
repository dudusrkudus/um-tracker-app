import { createClient } from '@/lib/supabase/server'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button, buttonVariants } from '@/components/ui/button'
import { TeamStatusDropdown } from '@/components/admin/team-status-dropdown'
import Link from 'next/link'

export default async function TeamsPage() {
  const supabase = await createClient()
  
  // Join teams with their categories and events
  const { data: teams, error } = await supabase
    .from('teams')
    .select(`
      *,
      events ( name ),
      categories ( code, runner_capacity )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return <div className="text-red-500">Error loading teams: {error.message}</div>
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl sm:text-2xl font-bold">Teams</h1>
        <Link href="/teams/create" className={buttonVariants({ variant: "default", size: "sm" })}>
          Create Team
        </Link>
      </div>

      {teams.length === 0 ? (
        <div className="text-center p-8 border rounded-lg text-gray-500 text-sm">
          No teams found. Create one to get started.
        </div>
      ) : (
        <div className="border rounded-lg overflow-x-auto bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team) => (
                <TableRow key={team.id}>
                  <TableCell className="font-medium">{team.team_code}</TableCell>
                  <TableCell>{team.team_name}</TableCell>
                  <TableCell>{(team.events as any)?.name}</TableCell>
                  <TableCell>{(team.categories as any)?.code}</TableCell>
                  <TableCell>
                    <TeamStatusDropdown teamId={team.id} currentStatus={team.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
