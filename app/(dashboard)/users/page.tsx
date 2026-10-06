import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UsersTable } from './users-table'

export default async function UsersPage() {
  const profile = await getCurrentProfile()
  
  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  const supabase = await createClient()

  // We only fetch profiles here. The email might not be accessible directly from public schema.
  // In a more robust system, we would join with auth.users via an admin RPC, but for MVP,
  // profile data is enough.
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return <div className="p-4 text-red-600 bg-red-50 rounded-lg">Gagal memuat pengguna: {error.message}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Pengguna</h1>
          <p className="text-muted-foreground">Kelola admin, PIC, dan hak akses panitia.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengguna</CardTitle>
          <CardDescription>Semua pengguna yang terdaftar di sistem</CardDescription>
        </CardHeader>
        <CardContent>
          <UsersTable profiles={profiles || []} />
        </CardContent>
      </Card>
    </div>
  )
}
