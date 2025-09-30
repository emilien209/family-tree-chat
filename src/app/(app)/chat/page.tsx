"use client";

import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, onSnapshot, doc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import MessageInput from "@/components/chat/message-input";
import MessageList from "@/components/chat/message-list";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Phone, Video, Users, Search, MessageSquarePlus } from "lucide-react";
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface User {
  id: string;
  name?: string;
  email?: string;
  avatar?: string;
}

export default function ChatPage() {
    const user = auth.currentUser;
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialUserId = searchParams.get('userId');

    const usersRef = collection(db, "users");
    const [usersSnapshot, usersLoading, usersError] = useCollection(usersRef);

    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [following, setFollowing] = useState<string[]>([]);
    const [followingLoading, setFollowingLoading] = useState(true);

     useEffect(() => {
        if (!user) return;
        const followingRef = collection(db, "users", user.uid, "following");
        const unsub = onSnapshot(followingRef, (snapshot) => {
            setFollowing(snapshot.docs.map(doc => doc.id));
            setFollowingLoading(false);
        }, (err) => {
            console.error(err);
            setFollowingLoading(false);
        });
        return unsub;
    }, [user]);

    const followedUsers = useMemo(() => {
        if (!usersSnapshot) return [];
        return usersSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as User))
            .filter(u => following.includes(u.id));
    }, [usersSnapshot, following]);


    useEffect(() => {
        if (usersLoading || followingLoading) return;
        
        const allUsers = usersSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)) || [];

        if (initialUserId) {
            const userToSelect = allUsers.find(u => u.id === initialUserId);
            if (userToSelect) {
                setSelectedUser(userToSelect);
                return;
            }
        }
        
        if (!selectedUser && followedUsers.length > 0) {
            setSelectedUser(followedUsers[0]);
        }
    }, [initialUserId, usersSnapshot, followedUsers, selectedUser, usersLoading, followingLoading]);
    
    const contactList = useMemo(() => {
        if (!usersSnapshot) return [];
        const allUsersMap = new Map(usersSnapshot.docs.map(doc => [doc.id, { id: doc.id, ...doc.data() } as User]));
        const contacts = new Set<User>();

        // Add followed users
        followedUsers.forEach(u => contacts.add(u));

        // If an initial user is selected via URL, add them to the list if not already present
        if (initialUserId) {
            const initialUser = allUsersMap.get(initialUserId);
            if (initialUser) {
                contacts.add(initialUser);
            }
        }

        return Array.from(contacts);

    }, [usersSnapshot, followedUsers, initialUserId]);


    return (
        <div className="flex h-screen bg-background">
            <aside className="w-80 border-r flex flex-col">
                <header className="p-4 border-b">
                     <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold font-headline">Messages</h2>
                        <Button variant="ghost" size="icon">
                            <MessageSquarePlus />
                        </Button>
                     </div>
                     <div className="relative mt-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search messages" className="pl-10"/>
                     </div>
                </header>
                <ScrollArea className="flex-1">
                   <nav className="p-2">
                       {(usersLoading || followingLoading) && <p className="p-4 text-sm text-muted-foreground">Loading contacts...</p>}
                       {usersError && <p className="p-4 text-sm text-destructive">Error loading contacts.</p>}
                       
                       {!usersLoading && !followingLoading && contactList.length === 0 && (
                            <div className="p-4 text-center text-muted-foreground">
                                <p>You are not following anyone yet.</p>
                                <Button variant="link" asChild><Link href="/members">Find members to follow</Link></Button>
                            </div>
                        )}

                       {contactList.map(u => (
                           <button 
                            key={u.id} 
                            className={`w-full text-left p-3 flex items-center gap-3 rounded-lg transition-colors ${selectedUser?.id === u.id ? 'bg-muted' : 'hover:bg-muted/50'}`}
                            onClick={() => setSelectedUser(u)}
                           >
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={u.avatar} />
                                    <AvatarFallback>{u.name?.charAt(0) || 'U'}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <p className="font-semibold">{u.name}</p>
                                    <p className="text-sm text-muted-foreground truncate">Last message preview...</p>
                                </div>
                                <span className="text-xs text-muted-foreground">2h</span>
                           </button>
                       ))}
                   </nav>
                </ScrollArea>
            </aside>
            
            <div className="flex flex-col flex-1">
                {selectedUser ? (
                    <>
                        <header className="flex items-center justify-between h-16 shrink-0 border-b px-6">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={selectedUser.avatar} />
                                    <AvatarFallback>{selectedUser.name?.charAt(0) || 'U'}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h2 className="text-lg font-semibold font-headline">{selectedUser.name}</h2>
                                    <p className="text-sm text-muted-foreground">Online</p>
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
                        <div className="border-t p-4 bg-background">
                            <MessageInput />
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        <p>Select a conversation to start messaging</p>
                    </div>
                )}
            </div>
        </div>
    )
}
