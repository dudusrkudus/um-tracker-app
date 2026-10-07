'use client'

import { useState, useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateRunner } from '@/lib/admin-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

const initialState = { error: '', success: false }

export function RunnerEditForm({ runner, teams }: { runner: any, teams: any[] }) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(updateRunner as any, initialState)

  useEffect(() => {
    if (state.success) {
      router.push('/runners')
    }
  }, [state.success, router])

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <input type="hidden" name="id" value={runner.id} />
      <input type="hidden" name="status" value={runner.status} />

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="team_id">Pilih Tim</Label>
          <Select name="team_id" defaultValue={runner.team_id} required>
            <SelectTrigger><SelectValue placeholder="Pilih tim" /></SelectTrigger>
            <SelectContent>
              {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.team_name} ({t.team_code})</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nama Pelari</Label>
            <Input id="full_name" name="full_name" required defaultValue={runner.full_name} placeholder="Budi Santoso" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="relay_order">Urutan Relay</Label>
            <Input id="relay_order" name="relay_order" type="number" required min="1" defaultValue={runner.relay_order} placeholder="1" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">No. Telp Pelari (Opsional)</Label>
          <Input id="phone" name="phone" defaultValue={runner.phone || ''} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="emergency_contact_name">Nama Kontak Darurat</Label>
            <Input id="emergency_contact_name" name="emergency_contact_name" defaultValue={runner.emergency_contact_name || ''} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergency_contact_phone">No. Telp Darurat</Label>
            <Input id="emergency_contact_phone" name="emergency_contact_phone" defaultValue={runner.emergency_contact_phone || ''} />
          </div>
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Simpan Perubahan
      </Button>
    </form>
  )
}
