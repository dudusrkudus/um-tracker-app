'use client'

import { useState } from 'react'
import { Plus, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { humanize } from '@/lib/format'
import { UserModal } from './user-modal'

type Profile = {
  id: string
  full_name: string
  phone: string | null
  role: string
  is_active: boolean
  created_at: string
}

export function UsersTable({ profiles }: { profiles: Profile[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<Profile | null>(null)

  const openCreate = () => {
    setEditingUser(null)
    setIsModalOpen(true)
  }

  const openEdit = (user: Profile) => {
    setEditingUser(user)
    setIsModalOpen(true)
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="mr-2 h-4 w-4" /> Tambah Pengguna
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Nama Lengkap</TableHead>
              <TableHead>Telepon</TableHead>
              <TableHead>Role / Peran</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.full_name}</TableCell>
                <TableCell>{p.phone || '-'}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-slate-100">{humanize(p.role)}</Badge>
                </TableCell>
                <TableCell>
                  {p.is_active ? (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Aktif</Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-800">Nonaktif</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                    <Edit2 className="h-4 w-4 text-slate-500 hover:text-indigo-600" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {profiles.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-slate-500">
                  Belum ada pengguna terdaftar.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {isModalOpen && (
        <UserModal 
          user={editingUser} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  )
}
