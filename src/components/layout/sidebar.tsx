"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  MessageSquare,
  Calendar,
  User,
  LogOut,
  Group,
  Settings,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"

const navItems = [
  { href: "/chat", icon: MessageSquare, label: "Chat", notifications: 3 },
  { href: "/events", icon: Calendar, label: "Events", notifications: 1 },
];

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-64 flex-col border-r bg-card p-4 md:flex">
      <div className="flex items-center gap-2 pb-4 border-b mb-4">
        <Group className="h-8 w-8 text-primary" />
        <h1 className="text-xl font-bold font-headline">Kimenyi</h1>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <Button
            key={item.label}
            variant={pathname === item.href ? "secondary" : "ghost"}
            className="w-full justify-start"
            asChild
          >
            <Link href={item.href}>
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
              {item.notifications && (
                <span className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs animation-bounce-subtle">
                  {item.notifications}
                </span>
              )}
            </Link>
          </Button>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-2">
        <div className="border-t -mx-4 my-2"></div>
        <div className="flex items-center gap-3">
            <Avatar>
                <AvatarImage src="https://picsum.photos/seed/user1/40/40" />
                <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
                <span className="font-semibold text-sm">John Doe</span>
                <span className="text-xs text-muted-foreground">john.doe@family.com</span>
            </div>
        </div>
        <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/profile">
                <User className="mr-2 h-4 w-4" /> Profile
            </Link>
        </Button>
        <Button variant="ghost" className="w-full justify-start">
          <LogOut className="mr-2 h-4 w-4" />
          <Link href="/">Log out</Link>
        </Button>
      </div>
    </aside>
  )
}
