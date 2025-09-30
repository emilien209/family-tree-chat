"use client";

import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface User {
  id: string;
  name?: string;
  email?: string;
  avatar?: string;
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

  useEffect(() => {
    // This is a simplified example.
    // In a real-world scenario, you'd want to fetch this from a 'users' collection
    // that you populate when a user registers.
    // For now, we will listen to online users as a proxy for all users.
    const q = query(collection(db, 'users'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedUsers: User[] = [];
      querySnapshot.forEach((doc) => {
        fetchedUsers.push({ id: doc.id, ...doc.data() } as User);
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

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center h-16 shrink-0 border-b px-6">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          <h2 className="text-xl font-semibold font-headline">Family Members</h2>
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
                            <AvatarImage src={user.avatar || `https://picsum.photos/seed/${user.id}/80/80`} />
                            <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <p className="font-semibold">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <Button variant="ghost" size="icon">
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
