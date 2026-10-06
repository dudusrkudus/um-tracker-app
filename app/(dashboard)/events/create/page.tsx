import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EventCreateForm } from '@/components/admin/event-create-form'
import { getCurrentProfile, hasRole } from '@/lib/auth'

export default async function CreateEventPage() {
  const profile = await getCurrentProfile()
  if (!hasRole(profile, ['admin', 'race_director'])) {
    return <div className="text-red-500">Anda tidak memiliki akses ke halaman ini.</div>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Buat Event Baru</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Data Event</CardTitle>
        </CardHeader>
        <CardContent>
          <EventCreateForm />
        </CardContent>
      </Card>
    </div>
  )
}
