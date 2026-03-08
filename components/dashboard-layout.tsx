'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import {
    Key,
    Activity,
    Settings,
    LogOut,
    ChevronRight,
    LayoutDashboard,
    BarChart2,
    Menu,
    X
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItemProps {
    href: string
    icon: React.ReactNode
    label: string
    active?: boolean
    onClick?: () => void
}

const NavItem = ({ href, icon, label, active, onClick }: NavItemProps) => (
    <Link
        href={href}
        onClick={onClick}
        className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
            active
                ? "bg-accent/15 text-accent border border-accent/20"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
        )}
    >
        {icon}
        <span>{label}</span>
        {active && <ChevronRight className="w-4 h-4 ml-auto" />}
    </Link>
)

interface DashboardLayoutProps {
    children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const pathname = usePathname()
    const { user, signOut, loading } = useAuth()
    const router = useRouter()
    const [sidebarOpen, setSidebarOpen] = React.useState(false)

    // Close sidebar on route change
    React.useEffect(() => {
        setSidebarOpen(false)
    }, [pathname])

    // Redirect if not authenticated
    React.useEffect(() => {
        if (!loading && !user) {
            router.push('/sign-in')
        }
    }, [user, loading, router])

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    <span className="text-muted-foreground text-sm">Loading...</span>
                </div>
            </div>
        )
    }

    if (!user) return null

    const navItems = [
        { href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Overview' },
        { href: '/dashboard/connections', icon: <Key className="w-5 h-5" />, label: 'Connections' },
        { href: '/dashboard/analytics', icon: <BarChart2 className="w-5 h-5" />, label: 'Analytics' },
        { href: '/dashboard/audit', icon: <Activity className="w-5 h-5" />, label: 'Audit Logs' },
        { href: '/dashboard/settings', icon: <Settings className="w-5 h-5" />, label: 'Settings' },
    ]

    const sidebarContent = (
        <>
            {/* Logo */}
            <div className="p-6 border-b border-border/50">
                <Link href="/" className="flex items-center gap-2.5 group">
                    <img src="/assets/providers/logo.png" alt="SecureGate Logo" className="h-8 w-8 object-contain" />
                    <span className="text-lg font-semibold tracking-tight font-mono">SecureGate</span>
                </Link>
                <div className="flex items-center gap-1.5 mt-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs text-muted-foreground">Active</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => (
                    <NavItem
                        key={item.href}
                        href={item.href}
                        icon={item.icon}
                        label={item.label}
                        active={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
                        onClick={() => setSidebarOpen(false)}
                    />
                ))}
            </nav>

            {/* User section */}
            <div className="p-4 border-t border-border/50">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {user.email?.[0].toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.email}</p>
                        <p className="text-xs text-muted-foreground">Signed in</p>
                    </div>
                    <button
                        onClick={() => signOut()}
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                        title="Sign out"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </>
    )

    return (
        <div className="min-h-screen bg-background flex">
            {/* Mobile top bar */}
            <div className="fixed top-0 left-0 right-0 z-40 lg:hidden flex items-center h-14 px-4 border-b border-border/50 bg-background/80 backdrop-blur-xl">
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 -ml-2 rounded-lg hover:bg-secondary/50 transition-colors"
                    aria-label="Open menu"
                >
                    <Menu className="w-5 h-5" />
                </button>
                <Link href="/" className="flex items-center gap-2 ml-3">
                    <img src="/assets/providers/logo.png" alt="SecureGate" className="h-6 w-6 object-contain" />
                    <span className="text-sm font-semibold tracking-tight font-mono">SecureGate</span>
                </Link>
            </div>

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setSidebarOpen(false)}
                    />
                    {/* Drawer */}
                    <aside className="absolute top-0 left-0 bottom-0 w-72 bg-card/95 backdrop-blur-xl border-r border-border/50 flex flex-col animate-in slide-in-from-left duration-200">
                        {/* Close button */}
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-secondary/50 transition-colors z-10"
                            aria-label="Close menu"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        {sidebarContent}
                    </aside>
                </div>
            )}

            {/* Desktop sidebar */}
            <aside className="hidden lg:flex w-72 border-r border-border/50 bg-card/30 backdrop-blur-xl flex-col shrink-0">
                {sidebarContent}
            </aside>

            {/* Main content */}
            <main className="flex-1 overflow-auto pt-14 lg:pt-0">
                <div className="p-4 sm:p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
