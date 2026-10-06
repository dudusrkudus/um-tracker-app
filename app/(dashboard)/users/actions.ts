'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  fullName: z.string().min(2, 'Nama minimal 2 karakter'),
  phone: z.string().optional(),
  role: z.enum(['admin', 'race_director', 'support_coordinator', 'marshal', 'runner', 'viewer'])
})

export async function createUserAction(prevState: any, formData: FormData) {
  try {
    const rawData = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      fullName: formData.get('fullName') as string,
      phone: formData.get('phone') as string,
      role: formData.get('role') as string,
    }

    const validated = userSchema.safeParse(rawData)
    
    if (!validated.success) {
      return { 
        error: 'Data tidak valid', 
        details: validated.error.flatten().fieldErrors 
      }
    }

    const supabase = createAdminClient()

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: validated.data.email,
      password: validated.data.password,
      email_confirm: true
    })

    if (authError || !authData.user) {
      return { error: authError?.message || 'Gagal membuat user di Auth' }
    }

    // 2. Create profile
    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      full_name: validated.data.fullName,
      phone: validated.data.phone || null,
      role: validated.data.role
    })

    if (profileError) {
      // Rollback auth user
      await supabase.auth.admin.deleteUser(authData.user.id)
      return { error: 'Gagal membuat profil: ' + profileError.message }
    }

    revalidatePath('/users')
    return { success: true }
    
  } catch (err: any) {
    return { error: err.message || 'Terjadi kesalahan sistem' }
  }
}

const updateSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string().min(2),
  phone: z.string().optional(),
  role: z.enum(['admin', 'race_director', 'support_coordinator', 'marshal', 'runner', 'viewer']),
  isActive: z.boolean()
})

export async function updateUserAction(prevState: any, formData: FormData) {
  try {
    const rawData = {
      id: formData.get('id') as string,
      fullName: formData.get('fullName') as string,
      phone: formData.get('phone') as string,
      role: formData.get('role') as string,
      isActive: formData.get('isActive') === 'true'
    }

    const validated = updateSchema.safeParse(rawData)
    
    if (!validated.success) {
      return { error: 'Data tidak valid' }
    }

    const supabase = createAdminClient()

    const { error } = await supabase.from('profiles').update({
      full_name: validated.data.fullName,
      phone: validated.data.phone || null,
      role: validated.data.role,
      is_active: validated.data.isActive
    }).eq('id', validated.data.id)

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/users')
    return { success: true }

  } catch (err: any) {
    return { error: err.message || 'Terjadi kesalahan sistem' }
  }
}
