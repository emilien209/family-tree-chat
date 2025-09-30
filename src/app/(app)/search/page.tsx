"use client";

import { Input } from "@/components/ui/input";
import { Search as SearchIcon, Mail } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

interface User {
  id: string;
  name?: string;
  email?: string;
  avatar?: string;
}

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();
  
  const [usersSnapshot, loading, error] = useCollection(collection(db, 'users'));
  
  const allUsers = useMemo(() => {
    if (!usersSnapshot) return [];
    return usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  }, [usersSnapshot]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return [];
    return allUsers.filter(user => 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allUsers, searchTerm]);
  
  const handleSendMessage = (userId: string) => {
    router.push(`/chat?userId=${userId}`);
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center h-16 shrink-0 border-b px-6">
        <div className="flex items-center gap-2 w-full max-w-md">
          <SearchIcon className="h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search for people..." 
            className="border-none focus-visible:ring-0 text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {searchTerm === "" && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Search for family members by name.</p>
          </div>
        )}
        
        {loading && searchTerm && (
            <div className="space-y-2">
                <Skeleton className="h-12 w-full"/>
                <Skeleton className="h-12 w-full"/>
                <Skeleton className="h-12 w-full"/>
            </div>
        )}

        {filteredUsers.length > 0 && (
            <div className="space-y-2">
                {filteredUsers.map(user => (
                    <div key={user.id} className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted">
                        <Avatar>
                            <AvatarImage src={user.avatar ?? undefined}/>
                            <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <p className="font-semibold">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleSendMessage(user.id)}>
                            <Mail />
                        </Button>
                    </div>
                ))}
            </div>
        )}

        {searchTerm && !loading && filteredUsers.length === 0 && (
             <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>No members found for "{searchTerm}".</p>
            </div>
        )}

      </div>
    </div>
  );
}
