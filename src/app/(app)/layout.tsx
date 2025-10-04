
"use client";

import NewSidebar from "@/components/layout/sidebar";
import { usePathname } from 'next/navigation';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import AssistantButton from "@/components/ai/assistant-button";


interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({
  children,
}: AppLayoutProps) {
    const pathname = usePathname();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-transparent text-foreground">
        <NewSidebar />
        <SidebarInset>
          <main className="flex-1 flex flex-col h-screen">
            {children}
          </main>
        </SidebarInset>
        <AssistantButton />
      </div>
    </SidebarProvider>
  );
}
