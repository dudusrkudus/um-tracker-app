'use client'

import { useState, useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createTeam } from '@/lib/admin-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

const initialState = { error: '', success: false }

export function TeamCreateForm({ events, categories }: { events: any[], categories: any[] }) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(createTeam as any, initialState)

  useEffect(() => {
    if (state.success) {
      router.push('/teams')
    }
  }, [state.success, router])

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="event_id">Event</Label>
          <Select name="event_id" required>
            <SelectTrigger><SelectValue placeholder="Pilih event" /></SelectTrigger>
            <SelectContent>
              {events.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category_id">Kategori</Label>
          <Select name="category_id" required>
            <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
            <SelectContent>
              {categories.map(c => <SelectItem key={c.id} value={c.id}>Kategori {c.code} ({c.runner_capacity} Orang)</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="team_code">Kode Tim</Label>
            <Input id="team_code" name="team_code" required placeholder="T-001" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="team_name">Nama Tim</Label>
            <Input id="team_name" name="team_name" required placeholder="Tim Alpha" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="captain_name">Nama Kapten (Opsional)</Label>
            <Input id="captain_name" name="captain_name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="captain_phone">No. Telp Kapten</Label>
            <Input id="captain_phone" name="captain_phone" />
          </div>
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Simpan Tim
      </Button>
    </form>
  )
}
