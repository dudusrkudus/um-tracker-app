import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RunnerEditForm } from '@/components/admin/runner-edit-form'
import { getCurrentProfile, hasRole } from '@/lib/auth'
import { notFound } from 'next/navigation'

export default async function EditRunnerPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const runnerId = params.id
  
  const [profile, supabase] = await Promise.all([getCurrentProfile(), createClient()])
  
  if (!hasRole(profile, ['admin', 'race_director'])) {
    return <div className="text-red-500">Anda tidak memiliki akses ke halaman ini.</div>
  }

  const { data: runner, error: runnerError } = await supabase
    .from('runners')
    .select('*')
    .eq('id', runnerId)
    .single()

  if (runnerError || !runner) {
    notFound()
  }

  const { data: teams } = await supabase
    .from('teams')
    .select('id, team_code, team_name')
    .order('team_code')

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Edit Data Pelari</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Data Pelari</CardTitle>
        </CardHeader>
        <CardContent>
          <RunnerEditForm runner={runner} teams={teams || []} />
        </CardContent>
      </Card>
    </div>
  )
}
