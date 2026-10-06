import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TeamCreateForm } from '@/components/admin/team-create-form'
import { getCurrentProfile, hasRole } from '@/lib/auth'

export default async function CreateTeamPage() {
  const [profile, supabase] = await Promise.all([getCurrentProfile(), createClient()])
  
  if (!hasRole(profile, ['admin', 'race_director'])) {
    return <div className="text-red-500">Anda tidak memiliki akses ke halaman ini.</div>
  }

  const [eventsRes, categoriesRes] = await Promise.all([
    supabase.from('events').select('id, name').order('created_at', { ascending: false }),
    supabase.from('categories').select('id, code, runner_capacity').order('code')
  ])

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Buat Tim Baru</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Data Tim</CardTitle>
        </CardHeader>
        <CardContent>
          <TeamCreateForm 
            events={eventsRes.data || []} 
            categories={categoriesRes.data || []} 
          />
        </CardContent>
      </Card>
    </div>
  )
}
