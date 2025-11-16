
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UnreadCount {
  id: string;
  count: number;
}

interface User {
  id: string;
  name?: string;
  avatar?: string;
}

export default function NewMessagesButton() {
  const router = useRouter();
  const user = auth.currentUser;
  const [unreadCounts, setUnreadCounts] = useState<UnreadCount[]>([]);
  const [usersSnapshot, usersLoading, usersError] = useCollection(collection(db, 'users'));

  useEffect(() => {
    if (!user) return;
    const unreadCountsRef = collection(db, 'users', user.uid, 'unreadCounts');
    const q = query(unreadCountsRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const counts: UnreadCount[] = [];
      snapshot.forEach((doc) => {
        if (doc.data().count > 0) {
          counts.push({ id: doc.id, count: doc.data().count });
        }
      });
      setUnreadCounts(counts);
    });

    return () => unsubscribe();
  }, [user]);

  const usersMap = useMemo(() => {
    if (usersLoading || !usersSnapshot) return new Map();
    const map = new Map<string, User>();
    usersSnapshot.docs.forEach(doc => {
      map.set(doc.id, { id: doc.id, ...doc.data() } as User);
    });
    // Add group chat manually
    map.set('group', { id: 'group', name: 'Family Group Chat' });
    return map;
  }, [usersSnapshot, usersLoading]);

  const unreadChats = useMemo(() => {
    return unreadCounts
      .map(uc => {
        const userInfo = usersMap.get(uc.id);
        return {
          ...uc,
          user: userInfo,
        };
      })
      .filter(chat => chat.user); // Filter out any unread counts for users not found
  }, [unreadCounts, usersMap]);

  if (unreadChats.length === 0) {
    return null;
  }

  const handleChatSelect = (chatId: string) => {
    if (chatId === 'group') {
      router.push('/chat?group=true');
    } else {
      router.push(`/chat?userId=${chatId}`);
    }
  };

  const totalUnreadCount = unreadChats.reduce((acc, chat) => acc + chat.count, 0);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg animation-bounce-subtle"
          size="icon"
        >
          <MessageSquare className="h-7 w-7" />
          <Badge className="absolute -top-1 -right-1" variant="destructive">
            {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2">
        <div className="font-semibold text-center mb-2 px-2 py-1">New Messages</div>
        <div className="space-y-1">
          {unreadChats.map(chat => (
            <button
              key={chat.id}
              className="w-full text-left p-2 flex items-center gap-3 rounded-md hover:bg-muted"
              onClick={() => handleChatSelect(chat.id)}
            >
              <Avatar className="h-9 w-9">
                 {chat.user?.id === 'group' ? (
                     <AvatarFallback><Users/></AvatarFallback>
                 ) : (
                    <>
                        <AvatarImage src={chat.user?.avatar} />
                        <AvatarFallback>{chat.user?.name?.charAt(0)}</AvatarFallback>
                    </>
                 )}
              </Avatar>
              <div className="flex-1">
                <p className="font-medium text-sm truncate">{chat.user?.name}</p>
              </div>
              <Badge variant="secondary">{chat.count}</Badge>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
