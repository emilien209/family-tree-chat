import Sidebar from "@/components/layout/sidebar";
import AiChat from "@/components/layout/ai-chat";
import { usePathname } from 'next/navigation';


interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({
  children,
}: AppLayoutProps) {
    const pathname = usePathname();
    const showAiChat = !pathname.startsWith('/chat');

  return (
    <div className="flex min-h-screen w-full bg-transparent text-foreground">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      {showAiChat && <AiChat />}
    </div>
  );
}
