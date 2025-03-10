"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { logout } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

const navItems = [
  { name: "Machines", href: "/dashboard/machines" },
  { name: "Deployments", href: "/dashboard/deployments" },
  { name: "Secrets", href: "/dashboard/secrets" },
  { name: "Domains", href: "/dashboard/domains" },
  { name: "Settings", href: "/dashboard/settings" },
]

export function DashboardHeader() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-10 border-b bg-card">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="font-serif text-2xl">
            Hermes
          </Link>
          <nav className="hidden md:flex">
            <ul className="flex gap-4">
              {navItems.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`px-3 py-2 text-sm font-medium transition-colors hover:text-primary ${
                      pathname === item.href ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <form action={logout}>
          <Button variant="ghost" size="icon" type="submit">
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Logout</span>
          </Button>
        </form>
      </div>
    </header>
  )
}

