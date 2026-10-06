import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckpointCreateForm } from '@/components/admin/checkpoint-create-form'
import { getCurrentProfile, hasRole } from '@/lib/auth'

export default async function EditCheckpointPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [profile, supabase] = await Promise.all([getCurrentProfile(), createClient()])

  if (!hasRole(profile, ['admin', 'race_director'])) {
    return <div className="text-red-500">Anda tidak memiliki akses ke halaman ini.</div>
  }

  const [{ data: checkpoint }, { data: events }] = await Promise.all([
    supabase.from('checkpoints').select('*').eq('id', id).single(),
    supabase.from('events').select('id, name'),
  ])

  if (!checkpoint) notFound()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Edit Checkpoint</h1>

      <Card>
        <CardHeader>
          <CardTitle>Data Checkpoint</CardTitle>
        </CardHeader>
        <CardContent>
          <CheckpointCreateForm events={events || []} checkpoint={checkpoint} />
        </CardContent>
      </Card>
    </div>
  )
}
