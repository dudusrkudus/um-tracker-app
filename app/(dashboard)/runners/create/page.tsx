import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RunnerCreateForm } from '@/components/admin/runner-create-form'
import { getCurrentProfile, hasRole } from '@/lib/auth'

export default async function CreateRunnerPage() {
  const [profile, supabase] = await Promise.all([getCurrentProfile(), createClient()])
  
  if (!hasRole(profile, ['admin', 'race_director'])) {
    return <div className="text-red-500">Anda tidak memiliki akses ke halaman ini.</div>
  }

  const { data: teams } = await supabase
    .from('teams')
    .select('id, team_code, team_name')
    .order('team_code')

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Tambah Pelari Baru</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Data Pelari</CardTitle>
        </CardHeader>
        <CardContent>
          <RunnerCreateForm teams={teams || []} />
        </CardContent>
      </Card>
    </div>
  )
}
