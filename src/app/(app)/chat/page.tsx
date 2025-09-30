"use client";

import { useEffect } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import MessageInput from "@/components/chat/message-input";
import MessageList from "@/components/chat/message-list";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Phone, Video } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Users } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

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

            // Attempt to set user offline on unload/close
            window.addEventListener('beforeunload', setUserOffline);

            return () => {
                // This will run when component unmounts
                setUserOffline();
                window.removeEventListener('beforeunload', setUserOffline);
            };
        }
    }, [user]);

    const onlineMembers = onlineUsersSnapshot?.docs.map(doc => doc.data()) || [];
    
    return (
        <div className="flex flex-col h-screen">
            <header className="flex items-center justify-between h-16 shrink-0 border-b px-6">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Avatar>
                            <AvatarImage src="https://picsum.photos/seed/group/40/40" />
                            <AvatarFallback>RT</AvatarFallback>
                        </Avatar>
                        <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold font-headline">Rumenera</h2>
                        <Popover>
                            <PopoverTrigger asChild>
                                 <p className="text-sm text-muted-foreground cursor-pointer hover:underline">
                                    {onlineMembers.length} member{onlineMembers.length !== 1 ? 's' : ''} online
                                </p>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-2">
                                <ScrollArea className="h-48">
                                    <div className="space-y-2">
                                         <h4 className="font-medium text-sm px-2">Online Members</h4>
                                        {onlineMembers.map((member) => (
                                            <div key={member.uid} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted">
                                                <div className="relative">
                                                     <Avatar className="h-8 w-8">
                                                        <AvatarImage src={member.avatar || `https://picsum.photos/seed/${member.uid}/40/40`} />
                                                        <AvatarFallback>{member.name?.charAt(0) || 'U'}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-green-500 border-2 border-background" />
                                                </div>
                                                <span className="text-sm font-medium truncate">{member.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                        <Phone className="h-5 w-5" />
                        <span className="sr-only">Audio Call</span>
                    </Button>
                    <Button variant="ghost" size="icon">
                        <Video className="h-5 w-5" />
                        <span className="sr-only">Video Call</span>
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
