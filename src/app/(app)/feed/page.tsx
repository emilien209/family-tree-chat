
"use client";

import { useState } from "react";
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, addDoc, serverTimestamp, query, orderBy, doc, updateDoc, increment } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Heart, MessageSquare, PlusCircle, Loader2, AlertTriangle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

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

  const postsRef = collection(db, "posts");
  const q = query(postsRef, orderBy("timestamp", "desc"));
  const [postsSnapshot, loading, error] = useCollection(q);

  const handleCreatePost = async () => {
    if (postContent.trim() === "" || !user) return;

    setIsPosting(true);
    try {
      await addDoc(postsRef, {
        author: {
          name: user.displayName,
          avatar: user.photoURL || `https://picsum.photos/seed/${user.uid}/40/40`,
          uid: user.uid,
        },
        content: postContent,
        likes: 0,
        comments: 0, // Placeholder
        timestamp: serverTimestamp(),
      });
      setPostContent("");
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
  
  const posts = postsSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() }));

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
                    <Textarea 
                      placeholder="What's on your mind?" 
                      className="min-h-[60px]" 
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      disabled={isPosting}
                    />
                </div>
                <div className="flex justify-between items-center">
                    <Button variant="ghost" size="sm" disabled><PlusCircle className="mr-2 h-4 w-4" /> Add Photo/Video</Button>
                    <Button onClick={handleCreatePost} disabled={isPosting || postContent.trim() === ''}>
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

          {!loading && posts?.map((post: any) => (
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
                <p className="whitespace-pre-wrap">{post.content}</p>
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
