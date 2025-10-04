
"use client";

import { Suspense } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, onSnapshot, doc, orderBy, setDoc } from 'firebase/firestore';
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
import { Skeleton } from '@/components/ui/skeleton';
import ChatPageContent from './chat-page-content';

export default function ChatPage() {
    return (
        <Suspense fallback={<ChatSkeleton />}>
            <ChatPageContent />
        </Suspense>
    );
}

const ChatSkeleton = () => (
    <div className="flex h-screen bg-background">
        <aside className="w-80 border-r flex flex-col">
            <header className="p-4 border-b">
                <Skeleton className="h-7 w-32 mb-4" />
                <Skeleton className="h-10 w-full" />
            </header>
            <div className="flex-1 p-2 space-y-2">
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
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                </div>
            </header>
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <p>Loading conversation...</p>
            </div>
        </div>
    </div>
);