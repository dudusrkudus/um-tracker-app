'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Map,
  Footprints,
  AlertTriangle,
  Menu,
  X,
  Users,
  MapPin,
  Calendar,
  UserCog,
  LogOut,
  ClipboardList,
  ChevronRight,
  Shield,
  Activity,
} from 'lucide-react'
import { cn } from 'cn'

interface MobileBottomNavProps {
  userEmail?: string
  isAdmin?: boolean
  userRole?: string
  signOutAction: () => Promise<void>
}

export function MobileBottomNav({
  userEmail,
  isAdmin = false,
  userRole = 'staff',
  signOutAction,
}: MobileBottomNavProps) {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Close drawer on path change
  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

  // Prevent background scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [drawerOpen])

  const primaryTabs = [
    {
      label: 'Beranda',
      href: '/dashboard',
      icon: LayoutDashboard,
      isActive: pathname === '/dashboard',
    },
    {
      label: 'Peta Live',
      href: '/map',
      icon: Map,
      isActive: pathname.startsWith('/map'),
    },
    {
      label: 'Pelari',
      href: '/runners',
      icon: Footprints,
      isActive: pathname.startsWith('/runners'),
    },
    {
      label: 'Insiden',
      href: '/incidents',
      icon: AlertTriangle,
      isActive: pathname.startsWith('/incidents'),
    },
  ]

  const allNavLinks = [
    { label: 'Dashboard Utama', href: '/dashboard', icon: LayoutDashboard, desc: 'Ringkasan & status balapan' },
    { label: 'Peta Live (GPS)', href: '/map', icon: Map, desc: 'Posisi real-time seluruh pelari' },
    { label: 'Daftar Pelari', href: '/runners', icon: Footprints, desc: 'Data pelari, token & status override' },
    { label: 'Insiden & SOS', href: '/incidents', icon: AlertTriangle, desc: 'Laporan darurat & foto lapangan' },
    { label: 'Tim Peserta', href: '/teams', icon: Shield, desc: 'Kelola tim & kategori relay' },
    { label: 'Checkpoints', href: '/checkpoints', icon: MapPin, desc: 'Titik pos & urutan rute' },
    { label: 'Log Checkpoint', href: '/checkpoint-logs', icon: ClipboardList, desc: 'Riwayat pencatatan waktu pos' },
    { label: 'Events', href: '/events', icon: Calendar, desc: 'Konfigurasi event & race status' },
  ]

  if (isAdmin) {
    allNavLinks.push({
      label: 'Manajemen Staf',
      href: '/users',
      icon: UserCog,
      desc: 'Kelola akun panitia & hak akses',
    })
  }

  const isMoreActive =
    !primaryTabs.some((tab) => tab.isActive) &&
    (pathname.startsWith('/teams') ||
      pathname.startsWith('/checkpoints') ||
      pathname.startsWith('/checkpoint-logs') ||
      pathname.startsWith('/events') ||
      pathname.startsWith('/users'))

  const userInitial = userEmail ? userEmail.charAt(0).toUpperCase() : 'U'

  return (
    <>
      {/* 1. BOTTOM NAVIGATION BAR (Mobile Only) */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-gray-200/80 dark:border-zinc-800 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] md:hidden safe-area-bottom"
      >
        <div className="grid grid-cols-5 h-16 items-center px-1 max-w-lg mx-auto">
          {primaryTabs.map((tab) => {
            const Icon = tab.icon
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all select-none',
                  tab.isActive
                    ? 'text-indigo-600 dark:text-indigo-400 font-semibold scale-102'
                    : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100 font-normal'
                )}
              >
                <div className="relative">
                  <div
                    className={cn(
                      'p-1 rounded-lg transition-colors',
                      tab.isActive && 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <span className="text-[10px] tracking-tight mt-0.5 leading-tight truncate max-w-[62px]">
                  {tab.label}
                </span>
              </Link>
            )
          })}

          {/* Tab 5: Menu / Lainnya */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className={cn(
              'flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer select-none',
              drawerOpen || isMoreActive
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100 font-normal'
            )}
          >
            <div
              className={cn(
                'p-1 rounded-lg transition-colors',
                (drawerOpen || isMoreActive) && 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
              )}
            >
              <Menu className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5 leading-tight truncate max-w-[62px]">
              Menu
            </span>
          </button>
        </div>
      </nav>

      {/* 2. SLIDE-UP DRAWER (Full Mobile Menu) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative bg-white dark:bg-zinc-900 rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col z-10 border-t border-gray-200 dark:border-zinc-800 animate-in slide-in-from-bottom duration-250">
            {/* Grab Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-12 h-1.5 bg-gray-300 dark:bg-zinc-700 rounded-full" />
            </div>

            {/* Header: User Profile Info */}
            <div className="p-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
                  {userInitial}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {userEmail || 'Petugas Race Control'}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800">
                      {userRole}
                    </span>
                    <span className="text-[11px] text-gray-400">Race Control</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                aria-label="Tutup menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Links List (Scrollable) */}
            <div className="overflow-y-auto p-3 space-y-1 divide-y divide-gray-50 dark:divide-zinc-800/40">
              <div className="pb-2">
                <div className="px-3 py-1.5 text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                  Menu Utama
                </div>
                <div className="grid grid-cols-1 gap-1">
                  {allNavLinks.map((item) => {
                    const Icon = item.icon
                    const isCurrent = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setDrawerOpen(false)}
                        className={cn(
                          'flex items-center justify-between p-2.5 rounded-xl transition-colors',
                          isCurrent
                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 font-medium'
                            : 'hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-200'
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={cn(
                              'p-2 rounded-lg shrink-0',
                              isCurrent
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400'
                            )}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold leading-tight">{item.label}</div>
                            <div className="text-[10px] text-gray-400 truncate mt-0.5">{item.desc}</div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 ml-2" />
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* Logout Option */}
              <div className="pt-2 pb-1 px-1">
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 transition-colors text-left"
                  >
                    <div className="p-2 rounded-lg bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 shrink-0">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold">Keluar Akun</div>
                      <div className="text-[10px] text-red-400">Logout dari Race Control</div>
                    </div>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
