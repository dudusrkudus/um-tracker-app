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
import Link from 'next/link'

export default async function CheckpointsPage() {
  const supabase = await createClient()
  
  const { data: checkpoints, error } = await supabase
    .from('checkpoints')
    .select(`
      *,
      events ( name )
    `)
    .order('sequence_no', { ascending: true })

  if (error) {
    return <div className="text-red-500">Error loading checkpoints: {error.message}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl sm:text-2xl font-bold">Checkpoints</h1>
        <Link href="/checkpoints/create" className={buttonVariants({ variant: "default", size: "sm" })}>
          Add Checkpoint
        </Link>
      </div>

      {checkpoints.length === 0 ? (
        <div className="text-center p-8 border rounded-lg text-gray-500 text-sm">
          No checkpoints found. Add one to get started.
        </div>
      ) : (
        <div className="border rounded-lg overflow-x-auto bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Seq</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Distance</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Lat, Lng</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {checkpoints.map((cp) => (
                <TableRow key={cp.id}>
                  <TableCell>{cp.sequence_no}</TableCell>
                  <TableCell className="font-medium">{cp.code}</TableCell>
                  <TableCell>{cp.name}</TableCell>
                  <TableCell>{cp.distance_km} km</TableCell>
                  <TableCell>{(cp.events as any)?.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{cp.latitude}, {cp.longitude}</TableCell>
                  <TableCell>
                    <Link href={`/checkpoints/${cp.id}/edit`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                      Edit
                    </Link>
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
