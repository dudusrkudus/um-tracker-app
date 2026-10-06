'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Map,
  Footprints,
  AlertTriangle,
  Users,
  MapPin,
  Calendar,
  UserCog,
  ClipboardList,
  Shield,
} from 'lucide-react'
import { cn } from 'cn'

interface SidebarNavProps {
  isAdmin?: boolean
}

export function SidebarNav({ isAdmin = false }: SidebarNavProps) {
  const pathname = usePathname()

  const links = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Live Map', href: '/map', icon: Map },
    { label: 'Events', href: '/events', icon: Calendar },
    { label: 'Teams', href: '/teams', icon: Shield },
    { label: 'Runners', href: '/runners', icon: Footprints },
    { label: 'Checkpoints', href: '/checkpoints', icon: MapPin },
    { label: 'Checkpoint Logs', href: '/checkpoint-logs', icon: ClipboardList },
    { label: 'Incidents', href: '/incidents', icon: AlertTriangle },
  ]

  if (isAdmin) {
    links.push({
      label: 'Users',
      href: '/users',
      icon: UserCog,
    })
  }

  return (
    <nav className="p-3 flex flex-col gap-1">
      {links.map((link) => {
        const Icon = link.icon
        const isActive =
          pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href))

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors font-medium',
              isActive
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 font-semibold shadow-2xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800'
            )}
          >
            <Icon
              className={cn(
                'w-4 h-4 shrink-0',
                isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'
              )}
            />
            <span>{link.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
