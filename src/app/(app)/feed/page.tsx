
"use client";

import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, addDoc, serverTimestamp, query, orderBy, doc, updateDoc, increment, getDoc, setDoc, deleteDoc, onSnapshot, limit, startAfter, getDocs, DocumentData } from 'firebase/firestore';
import { db, auth, storage } from '@/lib/firebase';
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Heart, MessageSquare, PlusCircle, Loader2, AlertTriangle, X, MoreHorizontal, Send } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow, subHours } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Input } from "@/components/ui/input";

const POSTS_PER_PAGE = 5;

const PostSkeleton = () => (
  <Card className="bg-card border-border">
    <CardHeader>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </CardHeader>
    <Skeleton className="h-[450px] w-full" />
    <CardFooter className="flex flex-col items-start gap-2 p-4">
       <Skeleton className="h-4 w-3/4" />
       <Skeleton className="h-4 w-1/2" />
       <div className="flex gap-2 mt-2">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
       </div>
    </CardFooter>
  </Card>
);

interface User {
  id: string;
  name?: string;
  email?: string;
  avatar?: string;
}

const StoryViewer = ({ user, onClose }: { user: User, onClose: () => void }) => (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="relative w-full max-w-sm h-[90vh] bg-background rounded-lg overflow-hidden shadow-2xl">
        <Image src={`https://picsum.photos/seed/${user.id}/400/800`} alt={`Story by ${user.name}`} fill objectFit="cover" loading="lazy"/>
        <div className="absolute top-0 left-0 w-full p-4 bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar} />
              <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <p className="text-white font-semibold text-sm">{user.name}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-white" onClick={onClose}>
          <X />
        </Button>
      </div>
    </div>
);

const PostMedia = ({ src, alt }: { src: string; alt: string }) => {
    const isVideo = src.includes('.mp4') || src.includes('video');
    if (isVideo) {
        return <video src={src} controls className="w-full object-cover aspect-square" />;
    }
    return <Image src={src} alt={alt} width={700} height={700} className="w-full object-cover aspect-square" loading="lazy" />;
};


export default function FeedPage() {
  const { toast } = useToast();
  const [user, setUser] = useState(auth.currentUser);
  const [postContent, setPostContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [postImage, setPostImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [following, setFollowing] = useState<string[]>([]);
  const [selectedStoryUser, setSelectedStoryUser] = useState<User | null>(null);

  const [posts, setPosts] = useState<DocumentData[]>([]);
  const [lastVisible, setLastVisible] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const usersRef = collection(db, "users");
  const [usersSnapshot, usersLoading, usersError] = useCollection(usersRef);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
        const postsRef = collection(db, "posts");
        const q = query(postsRef, orderBy("timestamp", "desc"), limit(POSTS_PER_PAGE));
        const documentSnapshots = await getDocs(q);

        const newPosts = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPosts(newPosts);

        const lastDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];
        setLastVisible(lastDoc);

        if (documentSnapshots.empty || documentSnapshots.size < POSTS_PER_PAGE) {
            setHasMore(false);
        }
    } catch(e) {
        console.error(e)
    } finally {
        setLoading(false);
    }
  }, []);

  const fetchMorePosts = useCallback(async () => {
    if (!lastVisible || !hasMore) return;
    setLoadingMore(true);
     try {
        const postsRef = collection(db, "posts");
        const q = query(postsRef, orderBy("timestamp", "desc"), startAfter(lastVisible), limit(POSTS_PER_PAGE));
        const documentSnapshots = await getDocs(q);
        
        const newPosts = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPosts(prevPosts => [...prevPosts, ...newPosts]);

        const lastDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];
        setLastVisible(lastDoc);

         if (documentSnapshots.empty || documentSnapshots.size < POSTS_PER_PAGE) {
            setHasMore(false);
        }
    } catch(e) {
        console.error(e)
    } finally {
        setLoadingMore(false);
    }
  }, [lastVisible, hasMore]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(newUser => {
      setUser(newUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const followingRef = collection(db, "users", user.uid, "following");
    const unsub = onSnapshot(followingRef, (snapshot) => {
        setFollowing(snapshot.docs.map(doc => doc.id));
    });
    return unsub;
  }, [user]);

  const stories = useMemo(() => {
    if (!usersSnapshot) return [];
    return usersSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as User))
        .filter(u => u.id !== user?.uid)
        .slice(0, 8);
  }, [usersSnapshot, user]);

  const suggestedUsers = useMemo(() => {
    if (!usersSnapshot || !user) return [];
    return usersSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as User))
        .filter(u => u.id !== user.uid && !following.includes(u.id))
        .slice(0, 5);
  }, [usersSnapshot, user, following]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPostImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setPostImage(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }


  const handleCreatePost = async () => {
    if ((postContent.trim() === "" && !postImage) || !user) return;

    setIsPosting(true);
    try {
      let imageUrl = "";
      if (postImage) {
        const storageRef = ref(storage, `posts/${user.uid}/${Date.now()}`);
        const snapshot = await uploadString(storageRef, postImage, 'data_url');
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      await addDoc(collection(db, 'posts'), {
        author: {
          name: user.displayName,
          avatar: user.photoURL,
          uid: user.uid,
        },
        content: postContent,
        imageUrl: imageUrl,
        likes: 0,
        comments: [],
        timestamp: serverTimestamp(),
      });
      setPostContent("");
      setPostImage(null);
      if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
    fetchPosts(); // Refresh posts
    } catch (err) {
      console.error("Error creating post: ", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not create post. Please try again.",
      });
    } finally {
      setIsPosting(false);
    }
  };

    const handleLikePost = async (postId: string, authorId: string) => {
        if (!user || user.uid === authorId) return; 
        
        const postRef = doc(db, "posts", postId);
        const likeRef = doc(postRef, "likes", user.uid);
        const notificationRef = collection(db, "users", authorId, "notifications");

        try {
            const likeDoc = await getDoc(likeRef);
            if (likeDoc.exists()) {
                await deleteDoc(likeRef);
                 await updateDoc(postRef, {
                    likes: increment(-1)
                });
            } else {
                await setDoc(likeRef, {
                    timestamp: serverTimestamp()
                });
                await updateDoc(postRef, {
                    likes: increment(1)
                });
                await addDoc(notificationRef, {
                    type: "like",
                    from: {
                        name: user.displayName,
                        avatar: user.photoURL,
                        uid: user.uid,
                    },
                    post: { id: postId },
                    read: false,
                    timestamp: serverTimestamp()
                });
            }
             setPosts(posts.map(p => p.id === postId ? {...p, likes: p.likes + (likeDoc.exists() ? -1 : 1)} : p));
        } catch (err) {
            console.error("Error liking post: ", err);
        }
    };
  

    const handleFollow = async (targetUserId: string) => {
        if (!user) return;
        const currentUserRef = doc(db, 'users', user.uid);
        const targetUserRef = doc(db, 'users', targetUserId);
        const followingRef = doc(currentUserRef, 'following', targetUserId);
        const followersRef = doc(targetUserRef, 'followers', user.uid);
        const notificationRef = collection(db, "users", targetUserId, "notifications");
        
        try {
            const isFollowing = following.includes(targetUserId);

            if (isFollowing) {
                await deleteDoc(followingRef);
                await deleteDoc(followersRef);
            } else {
                await setDoc(followingRef, { timestamp: serverTimestamp() });
                await setDoc(followersRef, { timestamp: serverTimestamp() });
                 await addDoc(notificationRef, {
                    type: "follow",
                    from: {
                        name: user.displayName,
                        avatar: user.photoURL,
                        uid: user.uid,
                    },
                    read: false,
                    timestamp: serverTimestamp()
                });
            }
        } catch (error) {
            console.error("Error following/unfollowing user:", error);
        }
    };

  return (
    <>
    {selectedStoryUser && <StoryViewer user={selectedStoryUser} onClose={() => setSelectedStoryUser(null)} />}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-4 md:p-6 max-w-6xl mx-auto">
        <div className="md:col-span-2 space-y-6">
            <div className="flex space-x-4 overflow-x-auto pb-4 -mx-4 px-4">
                {usersLoading && [...Array(8)].map((_, i) => (
                    <div key={i} className="flex-shrink-0 flex flex-col items-center gap-2 w-[80px]">
                       <Skeleton className="w-[60px] h-[60px] rounded-full" />
                       <Skeleton className="h-3 w-16" />
                    </div>
                ))}
                {stories.map(story => (
                    <button key={story.id} className="flex-shrink-0 flex flex-col items-center gap-2 w-[80px] text-left" onClick={() => setSelectedStoryUser(story)}>
                        <div className="relative w-[60px] h-[60px]">
                          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 animate-spin-slow"></div>
                           <Avatar className="w-[56px] h-[56px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-background">
                                <AvatarImage src={story.avatar} />
                                <AvatarFallback>{story.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                        </div>
                        <p className="text-xs truncate w-full text-center">{story.name}</p>
                    </button>
                ))}
            </div>

            <Card className="bg-card border-border">
                <CardHeader>
                    <div className="flex items-center gap-4">
                         <Avatar>
                            <AvatarImage src={user?.photoURL || undefined} />
                            <AvatarFallback>{user?.displayName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <Textarea 
                        placeholder={`What's on your mind, ${user?.displayName?.split(' ')[0] || 'User'}?`} 
                        className="min-h-[40px] bg-transparent border-none focus-visible:ring-0 resize-none" 
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                        disabled={isPosting}
                        />
                    </div>
                </CardHeader>
                <CardContent className="pt-0">
                    {postImage && (
                        <div className="relative w-fit mx-auto mb-4">
                            <Image src={postImage} alt="Preview" width={400} height={400} className="rounded-md object-cover max-h-[300px]" loading="lazy" />
                            <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={removeImage}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                    <div className="flex justify-between items-center">
                         <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept="image/*"
                        />
                        <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isPosting}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Photo
                        </Button>
                        <Button onClick={handleCreatePost} disabled={isPosting || (postContent.trim() === '' && !postImage)}>
                        {isPosting ? <Loader2 className="animate-spin" /> : "Post"}
                        </Button>
                    </div>
                </CardContent>
            </Card>


            {loading && (
                <div className="space-y-6">
                <PostSkeleton />
                <PostSkeleton />
                </div>
            )}

            {!loading && posts.length === 0 && (
                <Card className="bg-card border-border">
                <CardContent className="p-6 text-center text-muted-foreground">
                    <p>No posts yet.</p>
                    <p className="text-sm">Be the first to share something!</p>
                </CardContent>
                </Card>
            )}

            {!loading && posts.map((post: any) => (
                <Card key={post.id} className="bg-card border-border overflow-hidden">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src={post.author.avatar} />
                                <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold text-sm">{post.author.name}</p>
                                <p className="text-xs text-muted-foreground">
                                {post.timestamp ? formatDistanceToNow(post.timestamp.toDate(), { addSuffix: true }) : 'Just now'}
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
                    </div>
                </CardHeader>
                
                {post.imageUrl && (
                    <CardContent className="p-0">
                         <PostMedia src={post.imageUrl} alt={post.content || 'Post media'} />
                    </CardContent>
                )}
                <CardFooter className="flex flex-col items-start gap-2 p-4">
                     <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleLikePost(post.id, post.author.uid)}>
                            <Heart className="h-6 w-6" />
                        </Button>
                         <Button variant="ghost" size="icon">
                            <MessageSquare className="h-6 w-6" />
                        </Button>
                     </div>
                     <p className="font-semibold text-sm">{post.likes} likes</p>
                    {post.content && <p className="text-sm"><span className="font-semibold mr-1">{post.author.name}</span>{post.content}</p>}
                    <p className="text-xs text-muted-foreground cursor-pointer hover:underline">View all {post.comments?.length || 0} comments</p>
                     <div className="w-full flex items-center gap-2 pt-2">
                        <Input placeholder="Add a comment..." className="bg-transparent border-none text-sm focus-visible:ring-0" />
                        <Button variant="ghost" size="sm">Post</Button>
                    </div>
                </CardFooter>
                </Card>
            ))}

            {hasMore && !loading && (
                <Button onClick={fetchMorePosts} disabled={loadingMore} variant="outline" className="w-full">
                    {loadingMore ? <Loader2 className="animate-spin" /> : "Load More"}
                </Button>
            )}

        </div>
        <div className="hidden md:block space-y-6">
             <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="text-base">Suggested for you</CardTitle>
                </CardHeader>
                 <CardContent className="space-y-4">
                    {usersLoading && [...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3">
                           <Skeleton className="h-10 w-10 rounded-full" />
                           <div className="space-y-2 flex-1">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-16" />
                           </div>
                        </div>
                    ))}
                     {suggestedUsers.map((suggUser) => (
                         <div key={suggUser.id} className="flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                 <Avatar className="h-10 w-10">
                                     <AvatarImage src={suggUser.avatar} />
                                     <AvatarFallback>{suggUser.name?.charAt(0)}</AvatarFallback>
                                 </Avatar>
                                 <div>
                                     <p className="font-semibold text-sm">{suggUser.name}</p>
                                     <p className="text-xs text-muted-foreground">Suggested for you</p>
                                 </div>
                             </div>
                              <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`text-xs ${following.includes(suggUser.id) ? '' : 'text-primary'}`}
                                    onClick={() => handleFollow(suggUser.id)}
                                >
                                    {following.includes(suggUser.id) ? "Following" : "Follow"}
                                </Button>
                         </div>
                     ))}
                 </CardContent>
            </Card>
             <footer className="text-xs text-muted-foreground space-x-2">
                <span>About</span>
                <span>Help</span>
                <span>Press</span>
                <span>API</span>
                <span>Jobs</span>
                <span>Privacy</span>
                <span>Terms</span>
                <p className="mt-4">&copy; 2024 Family Chat</p>
            </footer>
        </div>
    </div>
    </>
  )
}
