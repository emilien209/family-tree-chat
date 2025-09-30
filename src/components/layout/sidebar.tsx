"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Search,
  Compass,
  Clapperboard,
  MessageSquare,
  Heart,
  PlusSquare,
  Calendar,
  Target,
  Users,
  Menu,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { auth } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

const mainNavItems = [
  { href: "/feed", icon: Home, label: "Home" },
  { href: "/search", icon: Search, label: "Search" },
  { href: "/explore", icon: Compass, label: "Explore" },
  { href: "/reels", icon: Clapperboard, label: "Reels" },
  { href: "/chat", icon: MessageSquare, label: "Messages", notifications: 0 },
  { href: "/notifications", icon: Heart, label: "Notifications", notifications: 0 },
  { href: "/create", icon: PlusSquare, label: "Create" },
];

const secondaryNavItems = [
  { href: "/events", icon: Calendar, label: "Events", notifications: 0 },
  { href: "/goals", icon: Target, label: "Family Goals", notifications: 0 },
  { href: "/members", icon: Users, label: "Members", notifications: 0 },
]

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
    <aside className="hidden w-64 flex-col border-r bg-background p-4 md:flex">
      <div className="flex items-center gap-2 pb-4 border-b mb-4">
        <h1 className="text-2xl font-bold font-serif">Kimenyi Connect</h1>
      </div>

      <nav className="flex-1 space-y-1">
        {mainNavItems.map((item) => (
          <Button
            key={item.label}
            variant={pathname.startsWith(item.href) ? "secondary" : "ghost"}
            className="w-full justify-start text-base"
            asChild
          >
            <Link href={item.href}>
              <item.icon className="mr-4 h-6 w-6" />
              {item.label}
              {item.notifications > 0 && (
                <span className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500 text-white text-xs">
                  {item.notifications}
                </span>
              )}
            </Link>
          </Button>
        ))}
         <Button
            variant={pathname.startsWith('/profile') ? "secondary" : "ghost"}
            className="w-full justify-start text-base"
            asChild
          >
            <Link href="/profile">
                <Avatar className="mr-4 h-6 w-6">
                  <AvatarImage src={user?.photoURL || `https://picsum.photos/seed/${user?.uid}/40/40`} />
                  <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
               Profile
            </Link>
        </Button>
      </nav>

      <div className="mt-auto flex flex-col gap-2">
         <div className="border-t -mx-4 my-2"></div>
         <h3 className="px-4 text-sm font-semibold text-muted-foreground">Family Space</h3>
         <nav className="flex-1 space-y-1">
            {secondaryNavItems.map((item) => (
            <Button
                key={item.label}
                variant={pathname.startsWith(item.href) ? "secondary" : "ghost"}
                className="w-full justify-start text-base"
                asChild
            >
                <Link href={item.href}>
                <item.icon className="mr-4 h-6 w-6" />
                {item.label}
                {item.notifications > 0 && (
                    <span className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500 text-white text-xs">
                    {item.notifications}
                    </span>
                )}
                </Link>
            </Button>
            ))}
        </nav>

        <div className="border-t -mx-4 my-2"></div>

        <Button variant="ghost" className="w-full justify-start text-base" onClick={handleLogout}>
          <Menu className="mr-4 h-6 w-6" />
          More
        </Button>
      </div>
    </aside>
  )
}
