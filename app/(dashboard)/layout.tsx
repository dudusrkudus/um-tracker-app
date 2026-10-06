import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LogOut, Activity } from 'lucide-react'
import { getCurrentProfile } from '@/lib/auth'
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav'
import { SidebarNav } from '@/components/navigation/SidebarNav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const profile = await getCurrentProfile()
  const isAdmin = profile?.role === 'admin'

  const signOut = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    return redirect('/login')
  }

  const userInitial = user.email ? user.email.charAt(0).toUpperCase() : 'U'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b h-14 sm:h-16 flex items-center justify-between px-3 sm:px-6 sticky top-0 z-30">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs">
            <Activity className="w-4 h-4" />
          </div>
          <div className="font-bold text-sm sm:text-base md:text-lg tracking-tight truncate">
            Ultra Marathon <span className="text-indigo-600 font-extrabold hidden xs:inline">Race Control</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
              {userInitial}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-medium text-gray-800 truncate max-w-[150px]">{user.email}</span>
              <span className="text-[10px] text-gray-400 capitalize">{profile?.role || 'Staff'}</span>
            </div>
          </div>
          <form action={signOut}>
            <button className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer" title="Keluar">
              <LogOut size={18} />
            </button>
          </form>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="w-60 bg-white border-r hidden md:block shrink-0">
          <SidebarNav isAdmin={isAdmin} />
        </aside>

        <main className="flex-1 p-3 sm:p-5 md:p-6 pb-24 md:pb-6 max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation & Slide-over Menu */}
      <MobileBottomNav
        userEmail={user.email}
        isAdmin={isAdmin}
        userRole={profile?.role}
        signOutAction={signOut}
      />
    </div>
  )
}
