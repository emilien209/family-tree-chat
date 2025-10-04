
"use client"

import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, UserPlus, MessageSquare, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

const NotificationSkeleton = () => (
    <div className="flex items-center gap-4 p-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/4" />
        </div>
    </div>
)

export default function NotificationsPage() {
    const user = auth.currentUser;
    const notificationsRef = user ? collection(db, 'users', user.uid, 'notifications') : null;
    const q = notificationsRef ? query(notificationsRef, orderBy("timestamp", "desc")) : null;
    const [notificationsSnapshot, loading, error] = useCollection(q);

    const renderNotificationText = (note: any) => {
        const fromUser = <Link href={`/profile/${note.from.uid}`} className="font-semibold hover:underline">{note.from.name}</Link>;
        switch(note.type) {
            case 'like':
                return <>{fromUser} liked your post.</>;
            case 'follow':
                return <>{fromUser} started following you.</>;
            case 'comment':
                 return <>{fromUser} commented on your post: "{note.comment}"</>;
            case 'message':
                 return <>You have a new message from {fromUser}.</>;
            default:
                return 'New notification';
        }
    }

    const getNotificationIcon = (type: string) => {
        switch(type) {
            case 'like':
                return <Heart className="h-5 w-5 text-red-500" />;
            case 'follow':
                return <UserPlus className="h-5 w-5 text-primary" />;
            case 'comment':
                return <MessageSquare className="h-5 w-5 text-blue-500" />;
            case 'message':
                return <MessageSquare className="h-5 w-5 text-sky-500" />;
            default:
                return <Heart className="h-5 w-5" />;
        }
    }

    return (
        <div className="flex flex-col h-full">
        <header className="flex items-center h-16 shrink-0 border-b px-6">
            <div className="flex items-center gap-2">
            <Heart className="h-6 w-6" />
            <h2 className="text-xl font-semibold font-headline">Notifications</h2>
            </div>
        </header>
        <div className="flex-1 overflow-y-auto">
            {loading && (
                 <ul className="divide-y">
                    {[...Array(5)].map((_, i) => <li key={i}><NotificationSkeleton /></li>)}
                 </ul>
            )}
             {error && (
                <div className="p-4">
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>Could not load notifications. Please try again.</AlertDescription>
                    </Alert>
                </div>
            )}
             {!loading && notificationsSnapshot?.empty && (
                <div className="p-6 text-center text-muted-foreground">
                    <p>No new notifications.</p>
                </div>
             )}
            <ul className="divide-y">
                {notificationsSnapshot?.docs.map((doc) => {
                    const note = doc.data();
                    return (
                        <li key={doc.id} className="flex items-center gap-4 p-4 hover:bg-muted/50">
                            <div className="relative">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={note.from.avatar} />
                                    <AvatarFallback>{note.from.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                                   {getNotificationIcon(note.type)}
                                </div>
                            </div>
                            <p className="flex-1 text-sm">
                                {renderNotificationText(note)}
                                <span className="text-muted-foreground ml-2">
                                    {note.timestamp ? formatDistanceToNow(note.timestamp.toDate(), { addSuffix: true }) : ''}
                                </span>
                            </p>
                        </li>
                    )
                })}
            </ul>
        </div>
        </div>
    );
}

    