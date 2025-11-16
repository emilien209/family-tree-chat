
"use client";

import { useState, useEffect, useCallback } from "react";
import { useDocumentData, useCollectionData } from "react-firebase-hooks/firestore";
import { doc, collection, query, where, orderBy, DocumentData, getDocs, onSnapshot, setDoc, deleteDoc, serverTimestamp, addDoc, increment } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Grid, Settings, UserPlus, UserCheck, MessageSquare } from "lucide-react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { notFound, useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

const PostGridItem = ({ post }: { post: DocumentData }) => (
    <div className="relative aspect-square bg-muted">
        {post.imageUrl && (
             post.mediaType && post.mediaType.startsWith('video') ? (
                <video src={post.imageUrl} className="w-full h-full object-cover" />
            ) : (
                <Image src={post.imageUrl} alt={post.content || "User post"} fill className="object-cover" />
            )
        )}
    </div>
);

export default function UserProfilePage({ params }: { params: { uid: string } }) {
    const router = useRouter();
    const [currentUser] = useState(auth.currentUser);

    const [user, loadingUser, errorUser] = useDocumentData(doc(db, "users", params.uid));
    const [posts, loadingPosts, errorPosts] = useCollectionData(query(collection(db, "posts"), where("author.uid", "==", params.uid), orderBy("timestamp", "desc")));
    
    // Follower and Following counts
    const [followersCount, setFollowersCount] = useState<number>(0);
    const [followingCount, setFollowingCount] = useState<number>(0);

    // Is current user following this profile?
    const [isFollowing, setIsFollowing] = useState(false);
    const [isCheckingFollow, setIsCheckingFollow] = useState(true);

    useEffect(() => {
        if (!params.uid) return;
        const followersRef = collection(db, "users", params.uid, "followers");
        const followingRef = collection(db, "users", params.uid, "following");
        
        const unsubFollowers = onSnapshot(followersRef, (snapshot) => setFollowersCount(snapshot.size));
        const unsubFollowing = onSnapshot(followingRef, (snapshot) => setFollowingCount(snapshot.size));

        return () => {
            unsubFollowers();
            unsubFollowing();
        }
    }, [params.uid]);
    
    useEffect(() => {
        if (!currentUser || !params.uid) {
            setIsCheckingFollow(false);
            return;
        }
        if (currentUser.uid === params.uid) {
            setIsCheckingFollow(false);
            return;
        }

        const followDocRef = doc(db, "users", currentUser.uid, "following", params.uid);
        const unsub = onSnapshot(followDocRef, (doc) => {
            setIsFollowing(doc.exists());
            setIsCheckingFollow(false);
        });

        return () => unsub();
    }, [currentUser, params.uid]);

    const handleFollowToggle = async () => {
        if (!currentUser || currentUser.uid === params.uid) return;

        const currentUserFollowingRef = doc(db, "users", currentUser.uid, "following", params.uid);
        const targetUserFollowersRef = doc(db, "users", params.uid, "followers", currentUser.uid);
        const notificationRef = collection(db, "users", params.uid, "notifications");

        if (isFollowing) {
            // Unfollow
            await deleteDoc(currentUserFollowingRef);
            await deleteDoc(targetUserFollowersRef);
        } else {
            // Follow
            await setDoc(currentUserFollowingRef, { timestamp: serverTimestamp() });
            await setDoc(targetUserFollowersRef, { timestamp: serverTimestamp() });
            
            await addDoc(notificationRef, {
                type: "follow",
                from: {
                    name: currentUser.displayName,
                    avatar: currentUser.photoURL,
                    uid: currentUser.uid,
                },
                read: false,
                timestamp: serverTimestamp()
            });
        }
    };
    
    const handleSendMessage = () => {
        router.push(`/chat?userId=${params.uid}`);
    };

    if (loadingUser || isCheckingFollow) {
        return (
            <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto p-4 md:p-6">
                    <header className="flex items-center gap-8 mb-8">
                        <Skeleton className="h-24 w-24 md:h-36 md:w-36 rounded-full" />
                        <div className="space-y-4">
                            <Skeleton className="h-8 w-48" />
                            <div className="flex gap-4">
                                <Skeleton className="h-5 w-20" />
                                <Skeleton className="h-5 w-20" />
                                <Skeleton className="h-5 w-20" />
                            </div>
                            <Skeleton className="h-10 w-32" />
                        </div>
                    </header>
                    <Separator />
                    <div className="mt-8">
                        <div className="grid grid-cols-3 gap-1 md:gap-4 mt-6">
                            <Skeleton className="aspect-square" />
                            <Skeleton className="aspect-square" />
                            <Skeleton className="aspect-square" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    
    if (errorUser) {
        return (
             <div className="flex items-center justify-center h-full">
                <Alert variant="destructive" className="max-w-md">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error Loading Profile</AlertTitle>
                    <AlertDescription>There was a problem loading this user's profile. Please try again later.</AlertDescription>
                </Alert>
             </div>
        );
    }

    if (!user) {
        notFound();
    }

    const isOwnProfile = currentUser?.uid === params.uid;

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <header className="flex items-center gap-8 mb-8">
                     <Avatar className="h-24 w-24 md:h-36 md:w-36 border-4">
                        <AvatarImage src={user?.avatar || undefined} />
                        <AvatarFallback className="text-4xl">{user?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                        <h1 className="text-2xl md:text-3xl font-bold">{user?.name}</h1>
                        <p className="text-muted-foreground">{user?.email}</p>
                        <div className="flex gap-4 text-sm pt-2">
                            <p><span className="font-bold">{posts?.length || 0}</span> posts</p>
                            <p><span className="font-bold">{followersCount}</span> followers</p>
                            <p><span className="font-bold">{followingCount}</span> following</p>
                        </div>
                        <div className="pt-2">
                            {isOwnProfile ? (
                                <Button variant="secondary" asChild>
                                    <Link href="/profile">
                                        <Settings className="mr-2 h-4 w-4" />
                                        Edit Profile
                                    </Link>
                                </Button>
                            ) : (
                                <div className="flex gap-2">
                                     <Button onClick={handleFollowToggle}>
                                        {isFollowing ? <UserCheck className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
                                        {isFollowing ? "Following" : "Follow"}
                                    </Button>
                                    <Button variant="secondary" onClick={handleSendMessage}>
                                        <MessageSquare className="mr-2 h-4 w-4" />
                                        Message
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <Separator />
                
                <Tabs defaultValue="posts" className="mt-8">
                    <TabsList className="grid w-full grid-cols-1 max-w-xs mx-auto">
                        <TabsTrigger value="posts"><Grid className="mr-2"/> Posts</TabsTrigger>
                    </TabsList>
                    <TabsContent value="posts" className="mt-6">
                        {loadingPosts && (
                            <div className="grid grid-cols-3 gap-1 md:gap-4">
                                <Skeleton className="aspect-square"/>
                                <Skeleton className="aspect-square"/>
                                <Skeleton className="aspect-square"/>
                            </div>
                        )}
                        {!loadingPosts && posts && posts.length > 0 ? (
                            <div className="grid grid-cols-3 gap-1 md:gap-4">
                                {posts.map(post => <PostGridItem key={post.id} post={post} />)}
                            </div>
                        ) : (
                            !loadingPosts && (
                                <div className="text-center text-muted-foreground py-16">
                                    <h3 className="text-xl font-semibold">No Posts Yet</h3>
                                    <p>This user hasn't shared any photos or videos.</p>
                                </div>
                            )
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}

    