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
import { RunnerTokenButton } from '@/components/admin/runner-token-button'
import { RunnerStatusDropdown } from '@/components/admin/runner-status-dropdown'
import Link from 'next/link'

export default async function RunnersPage() {
  const supabase = await createClient()
  
  const { data: runners, error } = await supabase
    .from('runners')
    .select(`
      *,
      teams ( team_name, team_code )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return <div className="text-red-500">Error loading runners: {error.message}</div>
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl sm:text-2xl font-bold">Runners</h1>
        <Link href="/runners/create" className={buttonVariants({ variant: "default", size: "sm" })}>
          Add Runner
        </Link>
      </div>

      {runners.length === 0 ? (
        <div className="text-center p-8 border rounded-lg text-gray-500 text-sm">
          No runners found. Add one to get started.
        </div>
      ) : (
        <div className="border rounded-lg overflow-x-auto bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Relay Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runners.map((runner) => (
                <TableRow key={runner.id}>
                  <TableCell className="font-medium">{runner.full_name}</TableCell>
                  <TableCell>{(runner.teams as any)?.team_name} ({(runner.teams as any)?.team_code})</TableCell>
                  <TableCell>#{runner.relay_order}</TableCell>
                  <TableCell>
                    <RunnerStatusDropdown runnerId={runner.id} currentStatus={runner.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2 items-center">
                      <Link href={`/runners/${runner.id}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                        Edit
                      </Link>
                      <RunnerTokenButton runnerId={runner.id} token={runner.tracking_token_hash} />
                    </div>
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
