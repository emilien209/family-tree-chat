
import { Suspense } from 'react';
import ChatPageContent from './chat-page-content';
import { Skeleton } from '@/components/ui/skeleton';

function ChatLoading() {
    return (
         <div className="flex h-screen bg-background">
            <aside className="w-80 border-r flex flex-col">
                <header className="p-4 border-b">
                     <Skeleton className="h-6 w-32 mb-4" />
                     <Skeleton className="h-10 w-full" />
                </header>
                <div className="p-2 space-y-2">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            </aside>
             <div className="flex flex-col flex-1">
                 <header className="flex items-center justify-between h-16 shrink-0 border-b px-6">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-16" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                </header>
                 <div className="flex-1 p-6 space-y-6">
                    <div className="flex items-start gap-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-64" />
                        </div>
                    </div>
                     <div className="flex items-start gap-4 justify-end">
                        <div className="space-y-2 items-end flex flex-col">
                            <Skeleton className="h-10 w-56" />
                        </div>
                        <Skeleton className="h-10 w-10 rounded-full" />
                    </div>
                 </div>
                 <div className="border-t p-4">
                     <Skeleton className="h-12 w-full" />
                 </div>
            </div>
        </div>
    )
}


export default function ChatPage() {
    return (
        <Suspense fallback={<ChatLoading />}>
            <ChatPageContent />
        </Suspense>
    );
}

