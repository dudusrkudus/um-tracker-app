'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, Loader2 } from 'lucide-react'
import { createUserAction, updateUserAction } from './actions'

type Profile = {
  id: string
  full_name: string
  phone: string | null
  role: string
  is_active: boolean
}

const ROLES = [
  { value: 'admin', label: 'Admin (Full Access)' },
  { value: 'race_director', label: 'Race Director' },
  { value: 'support_coordinator', label: 'Support Coordinator' },
  { value: 'marshal', label: 'Marshal (PIC Lapangan)' },
  { value: 'runner', label: 'Runner' },
  { value: 'viewer', label: 'Viewer (Read Only)' }
]

export function UserModal({ 
  user, 
  onClose 
}: { 
  user: Profile | null
  onClose: () => void 
}) {
  const isEditing = !!user
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg(null)

    const formData = new FormData(e.currentTarget)
    
    let result
    if (isEditing) {
      formData.append('id', user.id)
      result = await updateUserAction(null, formData)
    } else {
      result = await createUserAction(null, formData)
    }

    setIsLoading(false)

    if (result?.error) {
      setErrorMsg(result.error)
    } else if (result?.success) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="bg-slate-50 p-4 border-b flex items-center justify-between">
          <h3 className="font-bold text-lg text-slate-800">
            {isEditing ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!isEditing && (
            <>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Email Login</label>
                <input 
                  name="email"
                  type="email"
                  required
                  placeholder="email@contoh.com"
                  className="w-full border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Password Sementara</label>
                <input 
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  placeholder="Minimal 6 karakter"
                  className="w-full border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <hr className="my-2" />
            </>
          )}

          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">Nama Lengkap</label>
            <input 
              name="fullName"
              type="text"
              required
              defaultValue={user?.full_name}
              placeholder="Nama Lengkap"
              className="w-full border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">Nomor Telepon (Opsional)</label>
            <input 
              name="phone"
              type="text"
              defaultValue={user?.phone || ''}
              placeholder="08123456789"
              className="w-full border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">Role (Peran)</label>
            <select 
              name="role"
              required
              defaultValue={user?.role || 'marshal'}
              className="w-full border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {isEditing && (
            <div className="space-y-1 pt-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center space-x-2">
                <input 
                  name="isActive"
                  type="checkbox"
                  value="true"
                  defaultChecked={user?.is_active}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Akun Aktif (Bisa Login & Ditugaskan)</span>
              </label>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
              {errorMsg}
            </div>
          )}

          <div className="pt-4 flex justify-end space-x-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Simpan Perubahan' : 'Buat Pengguna'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
