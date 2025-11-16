
import { Suspense } from 'react';
import VideoCallContent from './video-call-content';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';

function VideoCallLoading() {
    return (
        <div className="flex h-screen w-full flex-col bg-muted text-foreground">
            <header className="flex items-center justify-between bg-background p-4 border-b shrink-0">
                <Skeleton className="h-6 w-48" />
                <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <Skeleton className="h-5 w-5" />
                </div>
            </header>
            
            <main className="flex-1 p-4 overflow-auto">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {[...Array(2)].map((_, i) => (
                         <div key={i} className="relative aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                            <Skeleton className="h-full w-full" />
                         </div>
                    ))}
                </div>
            </main>

            <footer className="bg-background/80 backdrop-blur-sm p-4 flex justify-center items-center gap-4 border-t">
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-14 w-14 rounded-full" />
            </footer>
        </div>
    );
}


export default function VideoCallPage() {
  return (
    <Suspense fallback={<VideoCallLoading />}>
      <VideoCallContent />
    </Suspense>
  );
}
