"use client";

import { collection, query, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Mail, Phone, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { GroupMessageDialog } from '@/components/members/group-message-dialog';

interface User {
  id: string;
  name?: string;
  email?: string;
  avatar?: string;
  online?: boolean;
}

const UserSkeleton = () => (
  <Card>
    <CardContent className="p-4 flex items-center gap-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
       <Skeleton className="h-8 w-8" />
       <Skeleton className="h-8 w-8" />
    </CardContent>
  </Card>
);

export default function MembersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const q = query(collection(db, 'users'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedUsers: User[] = [];
      querySnapshot.forEach((doc) => {
        // For demonstration, we'll randomly assign online status.
        // In a real app, this would come from a presence system (e.g., Firestore Realtime Database).
        fetchedUsers.push({ id: doc.id, online: Math.random() > 0.5, ...doc.data() } as User);
      });
      setUsers(fetchedUsers);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setError("Failed to fetch members. Please check your connection and try again.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSendMessage = (userId: string) => {
    router.push(`/chat?userId=${userId}`);
  };
  
  const handleStartGroupCall = () => {
    router.push('/video-call?type=group');
  }

  const handleSendGroupMessage = async (message: string) => {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, "chats", "group", "messages"), {
        text: message,
        timestamp: serverTimestamp(),
        user: {
          name: auth.currentUser.displayName,
          avatar: auth.currentUser.photoURL,
          uid: auth.currentUser.uid,
        },
      });
      router.push('/chat?group=true');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between h-16 shrink-0 border-b px-6">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          <h2 className="text-xl font-semibold font-headline">Family Members</h2>
        </div>
        <div className="flex items-center gap-2">
            <GroupMessageDialog onSend={handleSendGroupMessage} />
            <Button variant="outline" onClick={handleStartGroupCall}>
                <Video className="mr-2 h-4 w-4" />
                Group Call
            </Button>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-4">
             {loading && (
                <>
                    <UserSkeleton />
                    <UserSkeleton />
                    <UserSkeleton />
                </>
            )}

            {error && (
                <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {!loading && users.map((user) => (
                <Card key={user.id}>
                    <CardContent className="p-4 flex items-center gap-4">
                         <Avatar className="h-12 w-12">
                            <AvatarImage src={user.avatar ?? undefined} />
                            <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <p className="font-semibold">{user.name}</p>
                                {user.online && (
                                     <div className="flex items-center gap-1.5">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                        </span>
                                        <p className="text-xs text-muted-foreground">Online</p>
                                    </div>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleSendMessage(user.id)}>
                            <Mail className="h-5 w-5" />
                            <span className="sr-only">Send Message</span>
                        </Button>
                         <Button variant="ghost" size="icon">
                            <Phone className="h-5 w-5" />
                             <span className="sr-only">Call</span>
                        </Button>
                    </CardContent>
                </Card>
            ))}
        </div>
      </div>
    </div>
  );
}
