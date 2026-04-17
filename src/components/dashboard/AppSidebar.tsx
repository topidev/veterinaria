// src/components/dashboard/AppSidebar.tsx
'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  CalendarDays,
  MessageSquare,
  PawPrint,
  Users,
  User,
  Settings,
  CreditCard,
  Stethoscope,
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { logout } from '@/lib/actions/auth'
import type { UserRole } from '@/types/supabase'
import { UnreadBadge } from '../mensajeria/UnreadBadge'

const NAV_ITEMS: Record<UserRole, { label: string; href: string; icon: React.ElementType }[]> = {
  admin: [
    { label: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
    { label: 'Veterinarios', href: '/dashboard/admin/veterinarios', icon: Stethoscope },
    { label: 'Clientes', href: '/dashboard/admin/usuarios', icon: Users },
    { label: 'Reservaciones', href: '/reservaciones', icon: CalendarDays },
    { label: 'Pagos', href: '/pagos', icon: CreditCard },
    { label: 'Configuración', href: '/dashboard/admin/config', icon: Settings },
    { label: 'Servicios', href: '/dashboard/admin/servicios', icon: Stethoscope },
  ],
  veterinario: [
    { label: 'Dashboard', href: '/dashboard/veterinario', icon: LayoutDashboard },
    { label: 'Mi agenda', href: '/dashboard/veterinario/agenda', icon: CalendarDays },
    { label: 'Mensajes', href: '/mensajeria', icon: MessageSquare },
    { label: 'Configuración', href: '/dashboard/veterinario/perfil', icon: Settings },
  ],
  cliente: [
    { label: 'Dashboard', href: '/dashboard/cliente', icon: LayoutDashboard },
    { label: 'Mi perfil', href: '/dashboard/cliente/perfil', icon: User },
    { label: 'Mis mascotas', href: '/dashboard/cliente/mascotas', icon: PawPrint },
    { label: 'Reservaciones', href: '/reservaciones', icon: CalendarDays },
    { label: 'Mensajes', href: '/mensajeria', icon: MessageSquare },
    { label: 'Pagos', href: '/pagos', icon: CreditCard },
  ],
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
}

interface AppSidebarProps {
  role: UserRole
  fullName: string | null
  email: string
  avatarUrl: string | null
  unreadCount: number | null
  userId: string
}

export function AppSidebar({ role, fullName, email, avatarUrl, unreadCount, userId }: AppSidebarProps) {
  const pathname = usePathname()
  const navItems = NAV_ITEMS[role]

  const roleLabel: Record<UserRole, string> = {
    admin: 'Administrador',
    veterinario: 'Veterinario',
    cliente: 'Cliente',
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-3 bg-primary-foreground">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <PawPrint className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">PetCare</p>
            <p className="text-xs text-muted-foreground mt-0.5">{roleLabel[role]}</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className='bg-primary-foreground'>
        <SidebarGroup>
          <SidebarGroupLabel>Menú</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => {
              const isDashboardRoot = item.href === `/dashboard/${role}`
              const isActive = isDashboardRoot
                ? pathname === item.href
                : pathname.startsWith(item.href)

              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                    <Link href={item.href} className={`
                      ${isActive ? 'bg-accent text-primary-foreground' : ''}
                      transition-colors duration-350 cursor-pointer hover:bg-primary hover:text-primary-foreground`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                      {item.label === 'Mensajes' ? <UnreadBadge initialCount={unreadCount ?? 0} currentUserId={userId} /> : <></>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t bg-primary-foreground">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="transition-colors duration-350 data-[state=open]:bg-sidebar-accent cursor-pointer hover:bg-primary hover:text-primary-foreground">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={avatarUrl ?? undefined} alt={fullName ?? 'Usuario'} />
                    <AvatarFallback className="rounded-lg text-xs">
                      {getInitials(fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col text-left text-sm leading-tight">
                    <span className="font-medium truncate">{fullName ?? 'Usuario'}</span>
                    <span className="text-xs text-muted-foreground truncate">{email}</span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuItem asChild>
                  <Link className='transition-colors duration-350 cursor-pointer hover:bg-primary! hover:text-primary-foreground!' href={`/dashboard/${role}/perfil`}>Mi perfil</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="transition-colors duration-350 cursor-pointer text-destructive focus:text-destructive hover:bg-primary! hover:text-primary-foreground!"
                  onSelect={() => logout()}
                >
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}