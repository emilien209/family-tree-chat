
"use client";

import { useState, useRef, useMemo } from "react";
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, addDoc, serverTimestamp, query, orderBy, doc, updateDoc, increment } from 'firebase/firestore';
import { db, auth, storage } from '@/lib/firebase';
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Heart, MessageSquare, PlusCircle, Loader2, AlertTriangle, X } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow, subHours } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

const PostSkeleton = () => (
  <Card>
    <CardHeader>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-4/5" />
    </CardContent>
    <CardFooter>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-8 w-24 ml-4" />
    </CardFooter>
  </Card>
);

export default function FeedPage() {
  const { toast } = useToast();
  const user = auth.currentUser;
  const [postContent, setPostContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [postImage, setPostImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const postsRef = collection(db, "posts");
  const q = query(postsRef, orderBy("timestamp", "desc"));
  const [postsSnapshot, loading, error] = useCollection(q);

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

      await addDoc(postsRef, {
        author: {
          name: user.displayName,
          avatar: user.photoURL || `https://picsum.photos/seed/${user.uid}/40/40`,
          uid: user.uid,
        },
        content: postContent,
        imageUrl: imageUrl,
        likes: 0,
        comments: 0, // Placeholder
        timestamp: serverTimestamp(),
      });
      setPostContent("");
      setPostImage(null);
      if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
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

  const handleLikePost = async (postId: string) => {
    if (!user) return;
    const postRef = doc(db, "posts", postId);
    try {
      // For simplicity, we're just incrementing.
      // A more robust solution would track who has liked the post.
      await updateDoc(postRef, {
        likes: increment(1)
      });
    } catch (err) {
      console.error("Error liking post: ", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not like post.",
      });
    }
  };
  
  const posts = useMemo(() => {
    if (!postsSnapshot) return [];
    const twentyFourHoursAgo = subHours(new Date(), 24);
    return postsSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(post => post.timestamp && post.timestamp.toDate() > twentyFourHoursAgo);
  }, [postsSnapshot]);

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between h-16 shrink-0 border-b px-6">
        <h2 className="text-xl font-semibold font-headline">Family Feed</h2>
      </header>
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
                <CardTitle>Create a post</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="flex items-start gap-4">
                     <Avatar>
                        <AvatarImage src={user?.photoURL || `https://picsum.photos/seed/${user?.uid}/40/40`} />
                        <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                        <Textarea 
                        placeholder="What's on your mind?" 
                        className="min-h-[60px]" 
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                        disabled={isPosting}
                        />
                        {postImage && (
                            <div className="relative w-fit">
                                <Image src={postImage} alt="Preview" width={100} height={100} className="rounded-md object-cover" />
                                <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={removeImage}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
                 <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                />
                <div className="flex justify-between items-center">
                     <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isPosting}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Photo
                    </Button>
                    <Button onClick={handleCreatePost} disabled={isPosting || (postContent.trim() === '' && !postImage)}>
                      {isPosting ? <Loader2 className="animate-spin" /> : "Post"}
                    </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {loading && (
             <div className="space-y-6">
              <PostSkeleton />
              <PostSkeleton />
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error Loading Feed</AlertTitle>
              <AlertDescription>Could not load posts. Please check your connection and try again.</AlertDescription>
            </Alert>
          )}

          {!loading && posts.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <p>No posts in the last 24 hours.</p>
                <p className="text-sm">Be the first to share something!</p>
              </CardContent>
            </Card>
          )}

          {!loading && posts.map((post: any) => (
            <Card key={post.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarImage src={post.author.avatar} />
                        <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold">{post.author.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {post.timestamp ? formatDistanceToNow(post.timestamp.toDate(), { addSuffix: true }) : 'Just now'}
                        </p>
                    </div>
                </div>
              </CardHeader>
              <CardContent>
                {post.content && <p className="whitespace-pre-wrap">{post.content}</p>}
                 {post.imageUrl && (
                    <div className="mt-4 -mx-6 md:mx-0">
                        <Image src={post.imageUrl} alt="Post image" width={600} height={400} className="w-full object-cover" />
                    </div>
                 )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={() => handleLikePost(post.id)}>
                    <Heart className="h-4 w-4" /> {post.likes} Likes
                </Button>
                 <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" /> {post.comments} Comments
                </Button>
              </CardFooter>
            </Card>
          ))}

        </div>
      </div>
    </div>
  )
}
