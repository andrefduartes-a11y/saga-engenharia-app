'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, User } from 'lucide-react'

const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Início' },
    { href: '/perfil', icon: User, label: 'Perfil' },
]

export default function BottomNav() {
    const pathname = usePathname()

    return (
        <nav className="bottom-nav">
            {navItems.map(({ href, icon: Icon, label }) => {
                const active = pathname === href || pathname.startsWith(href + '/')
                return (
                    <Link
                        key={href}
                        href={href}
                        className={`nav-item ${active ? 'active' : ''}`}
                    >
                        <Icon size={22} />
                        <span>{label}</span>
                    </Link>
                )
            })}
        </nav>
    )
}
