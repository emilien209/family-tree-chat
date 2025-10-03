
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Search,
  Clapperboard,
  MessageSquare,
  Heart,
  PlusSquare,
  Calendar,
  Target,
  Users,
  LogOut,
  Grid,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { auth, db } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useEffect, useState } from "react"
import { collection, onSnapshot } from 'firebase/firestore';
import Image from "next/image"
import { MoreHorizontal } from "lucide-react"
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Button } from "../ui/button"

const mainNavItems = [
  { href: "/feed", icon: Home, label: "Home" },
  { href: "/search", icon: Search, label: "Search" },
  { href: "/reels", icon: Clapperboard, label: "Reels" },
  { href: "/chat", icon: MessageSquare, label: "Messages" },
  { href: "/notifications", icon: Heart, label: "Notifications" },
  { href: "/create", icon: PlusSquare, label: "Create" },
];

const secondaryNavItems = [
  { href: "/media", icon: Grid, label: "Media" },
  { href: "/events", icon: Calendar, label: "Events" },
  { href: "/goals", icon: Target, label: "Family Goals" },
  { href: "/members", icon: Users, label: "Members" },
]

export default function NewSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState(auth.currentUser);
  const [messageNotifications, setMessageNotifications] = useState(0);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(newUser => {
      setUser(newUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unreadCountsRef = collection(db, 'users', user.uid, 'unreadCounts');
    const unsubscribe = onSnapshot(unreadCountsRef, (snapshot) => {
        let totalUnread = 0;
        snapshot.forEach(doc => {
            totalUnread += doc.data().count || 0;
        });
        setMessageNotifications(totalUnread);
    });
    return () => unsubscribe();
  }, [user]);

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
    <Sidebar collapsible="icon">
        <SidebarHeader>
             <div className={cn("flex items-center gap-2", "group-data-[collapsible=icon]:hidden")}>
                <Image src="/logo.png" alt="Family Chat Logo" width={40} height={40} />
                <h1 className="text-lg font-bold font-serif">Family Tree Chat</h1>
            </div>
             <div className={cn("hidden items-center gap-2", "group-data-[collapsible=icon]:flex")}>
                <Image src="/logo.png" alt="Family Chat Logo" width={32} height={32} />
            </div>
        </SidebarHeader>
        <SidebarContent>
            <SidebarMenu>
                {mainNavItems.map((item) => {
                    const notifications = item.href === '/chat' ? messageNotifications : 0;
                    return (
                        <SidebarMenuItem key={item.label}>
                            <Link href={item.href}>
                                <SidebarMenuButton isActive={pathname.startsWith(item.href)} tooltip={item.label}>
                                    <item.icon />
                                    <span>{item.label}</span>
                                    {notifications > 0 && <SidebarMenuBadge>{notifications}</SidebarMenuBadge>}
                                </SidebarMenuButton>
                            </Link>
                        </SidebarMenuItem>
                    )
                })}
                 <SidebarMenuItem>
                    <Link href="/profile">
                        <SidebarMenuButton isActive={pathname.startsWith('/profile')} tooltip="Profile">
                            <Avatar className="h-6 w-6">
                                <AvatarImage src={user?.photoURL || undefined} />
                                <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                            <span>Profile</span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="mt-auto">
            <SidebarSeparator />
            <SidebarGroup>
                <span className="px-2 text-xs font-medium text-muted-foreground">Family Space</span>
                <SidebarMenu>
                    {secondaryNavItems.map((item) => (
                        <SidebarMenuItem key={item.label}>
                            <Link href={item.href}>
                                <SidebarMenuButton isActive={pathname.startsWith(item.href)} tooltip={item.label}>
                                    <item.icon />
                                    <span>{item.label}</span>
                                </SidebarMenuButton>
                            </Link>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroup>
            <SidebarSeparator />
            <SidebarMenu>
                <SidebarMenuItem>
                    <Button variant="ghost" className="w-full justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8" onClick={handleLogout}>
                        <LogOut className="group-data-[collapsible=icon]:h-4 group-data-[collapsible=icon]:w-4" />
                        <span className="group-data-[collapsible=icon]:hidden">Log out</span>
                    </Button>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
    </Sidebar>
  )
}
