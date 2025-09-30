import MessageInput from "@/components/chat/message-input";
import MessageList from "@/components/chat/message-list";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ChatPage() {
    return (
        <div className="flex flex-col h-screen">
            <header className="flex items-center h-16 shrink-0 border-b px-6">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Avatar>
                            <AvatarImage src="https://picsum.photos/seed/group/40/40" />
                            <AvatarFallback>RT</AvatarFallback>
                        </Avatar>
                        <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold font-headline">Rumenera Tree Family</h2>
                        <p className="text-sm text-muted-foreground">4 members online</p>
                    </div>
                </div>
            </header>
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <MessageList />
            </div>
            <div className="border-t p-4">
                <MessageInput />
            </div>
        </div>
    )
}
