"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  MessageSquare,
  Calendar,
  User,
  LogOut,
  Group,
  Newspaper,
  Target,
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
import { auth } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

const navItems = [
  { href: "/chat", icon: MessageSquare, label: "Chat", notifications: 3 },
  { href: "/feed", icon: Newspaper, label: "Family Feed", notifications: 0 },
  { href: "/events", icon: Calendar, label: "Events", notifications: 1 },
  { href: "/goals", icon: Target, label: "Family Goals", notifications: 0 },
];

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const user = auth.currentUser

  const handleLogout = async () => {
    try {
      await auth.signOut()
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      })
      router.push("/login")
    } catch (error) {
      console.error("Error logging out: ", error)
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "There was an error logging you out. Please try again.",
      })
    }
  }

  return (
    <aside className="hidden w-64 flex-col border-r bg-card p-4 md:flex">
      <div className="flex items-center gap-2 pb-4 border-b mb-4">
        <Group className="h-8 w-8 text-primary" />
        <h1 className="text-xl font-bold font-headline">Rumenera</h1>
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
              {item.notifications > 0 && (
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
        {user ? (
           <div className="flex items-center gap-3">
              <Avatar>
                  <AvatarImage src={user.photoURL || `https://picsum.photos/seed/${user.uid}/40/40`} />
                  <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden">
                  <span className="font-semibold text-sm truncate">{user.displayName || 'User'}</span>
                  <span className="text-xs text-muted-foreground truncate">{user.email}</span>
              </div>
          </div>
        ) : (
           <div className="flex items-center gap-3">
              <Avatar>
                  <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                  <span className="font-semibold text-sm">Not logged in</span>
              </div>
          </div>
        )}
        <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/profile">
                <User className="mr-2 h-4 w-4" /> Profile
            </Link>
        </Button>
        <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </Button>
      </div>
    </aside>
  )
}
