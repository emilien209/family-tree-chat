"use client";

import { useEffect } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import MessageInput from "@/components/chat/message-input";
import MessageList from "@/components/chat/message-list";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Phone, Video, Users } from "lucide-react";
import Link from 'next/link';

export default function ChatPage() {
    const user = auth.currentUser;
    const onlineUsersRef = collection(db, "chats", "rumenera", "onlineUsers");

    const [onlineUsersSnapshot, loading, error] = useCollection(onlineUsersRef);

    useEffect(() => {
        if (user) {
            const userStatusRef = doc(onlineUsersRef, user.uid);
            
            const setUserOnline = () => {
                setDoc(userStatusRef, {
                    name: user.displayName,
                    avatar: user.photoURL,
                    uid: user.uid,
                    timestamp: serverTimestamp()
                });
            };

            const setUserOffline = () => {
                deleteDoc(userStatusRef);
            };

            setUserOnline();

            window.addEventListener('beforeunload', setUserOffline);

            return () => {
                setUserOffline();
                window.removeEventListener('beforeunload', setUserOffline);
            };
        }
    }, [user, onlineUsersRef]);

    const onlineMembersCount = onlineUsersSnapshot?.docs.length || 0;
    
    return (
        <div className="flex flex-col h-screen">
            <header className="flex items-center justify-between h-16 shrink-0 border-b px-6">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Avatar>
                            <AvatarImage src="https://picsum.photos/seed/group/40/40" />
                            <AvatarFallback>RT</AvatarFallback>
                        </Avatar>
                        {onlineMembersCount > 0 && <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 border-2 border-background" />}
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold font-headline">Rumenera</h2>
                         <p className="text-sm text-muted-foreground">
                            {loading ? 'Loading...' : `${onlineMembersCount} member${onlineMembersCount !== 1 ? 's' : ''} online`}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                        <Phone className="h-5 w-5" />
                        <span className="sr-only">Audio Call</span>
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/video-call">
                            <Video className="h-5 w-5" />
                            <span className="sr-only">Video Call</span>
                        </Link>
                    </Button>
                     <Button variant="ghost" size="icon" asChild>
                        <Link href="/members">
                            <Users className="h-5 w-5" />
                            <span className="sr-only">View Members</span>
                        </Link>
                    </Button>
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
