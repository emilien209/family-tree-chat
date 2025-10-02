
"use client";

import { useState, useEffect, useRef } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Image from "next/image";
import { format } from 'date-fns';
import { AlertTriangle, Users } from 'lucide-react';

interface Message {
    id: string;
    user: {
        name: string;
        avatar: string;
        uid: string;
    };
    text?: string;
    imageUrl?: string;
    timestamp: Timestamp | null;
}

const MessageSkeleton = () => (
    <div className="flex items-start gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full max-w-md" />
        </div>
    </div>
);

interface MessageListProps {
    chatId?: string | null;
}


export default function MessageList({ chatId }: MessageListProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const currentUser = auth.currentUser;

    useEffect(() => {
        if (!chatId) {
            setLoading(false);
            setMessages([]);
            return;
        };

        setLoading(true);

        const collectionPath = chatId === 'group'
            ? 'chats/group/messages'
            : `privateChats/${chatId}/messages`;

        const q = query(collection(db, collectionPath), orderBy("timestamp", "asc"));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const msgs: Message[] = [];
            querySnapshot.forEach((doc) => {
                msgs.push({ id: doc.id, ...doc.data() } as Message);
            });
            setMessages(msgs);
            setLoading(false);
        }, (err) => {
            console.error(err);
            setError("Failed to fetch messages.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [chatId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (!chatId) {
        return null;
    }

    if (loading) {
        return (
            <div className="space-y-6">
                {[...Array(5)].map((_, i) => <MessageSkeleton key={i} />)}
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive" className='max-w-md mx-auto'>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    if (messages.length === 0) {
        return (
             <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center">
                {chatId === 'group' ? (
                   <>
                    <Users className="h-12 w-12 mb-4"/>
                    <h3 className="text-lg font-semibold">Welcome to the Family Group Chat!</h3>
                    <p>Be the first to send a message to everyone.</p>
                   </>
                ) : (
                    <>
                    <h3 className="text-lg font-semibold">Start the conversation!</h3>
                    <p>There are no messages here yet. Send one to get things started.</p>
                    </>
                )}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {messages.map((message) => {
                const isCurrentUser = message.user.uid === currentUser?.uid;
                const time = message.timestamp ? format(message.timestamp.toDate(), 'p') : '';

                return (
                    <div key={message.id} className={`flex items-start gap-4 ${isCurrentUser ? 'justify-end' : ''}`}>
                        {!isCurrentUser && (
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={message.user.avatar} alt={message.user.name} />
                                <AvatarFallback>{message.user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                        )}
                        <div className={`flex flex-col gap-1 ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                            <div className={`rounded-lg p-3 max-w-xs md:max-w-md lg:max-w-lg ${isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                {!isCurrentUser && <p className="font-semibold text-sm mb-1">{message.user.name}</p>}
                                {message.imageUrl && (
                                    <Image
                                        src={message.imageUrl}
                                        alt="Shared media"
                                        width={400}
                                        height={300}
                                        className="rounded-md my-2 object-cover"
                                    />
                                )}
                                {message.text && <p className="text-sm">{message.text}</p>}
                            </div>
                            <span className="text-xs text-muted-foreground">{time}</span>
                        </div>
                        {isCurrentUser && (
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={currentUser?.photoURL ?? undefined} alt={message.user.name} />
                                <AvatarFallback>{currentUser?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                        )}
                    </div>
                );
            })}
             <div ref={messagesEndRef} />
        </div>
    );
}

    