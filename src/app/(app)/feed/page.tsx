

"use client";

import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { useCollection, useDocumentData } from 'react-firebase-hooks/firestore';
import { collection, addDoc, serverTimestamp, query, orderBy, doc, updateDoc, increment, getDoc, setDoc, deleteDoc, onSnapshot, limit, startAfter, getDocs, DocumentData, arrayUnion, where, Timestamp } from 'firebase/firestore';
import { db, auth, storage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Heart, MessageSquare, PlusCircle, Loader2, AlertTriangle, X, MoreHorizontal, Send, Trash2, Plus } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import Link from 'next/link';

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

interface Story {
  id: string;
  author: {
    name: string;
    avatar: string;
    uid: string;
  };
  imageUrl: string;
  timestamp: Timestamp;
}


const StoryViewer = ({ story, onClose }: { story: Story, onClose: () => void }) => (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="relative w-full max-w-sm h-[90vh] bg-background rounded-lg overflow-hidden shadow-2xl">
        <Image src={story.imageUrl} alt={`Story by ${story.author.name}`} fill objectFit="cover" loading="lazy"/>
        <div className="absolute top-0 left-0 w-full p-4 bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={story.author.avatar} />
              <AvatarFallback>{story.author.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <p className="text-white font-semibold text-sm">{story.author.name}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-white" onClick={onClose}>
          <X />
        </Button>
      </div>
    </div>
);

const PostMedia = ({ post }: { post: any }) => {
    const mediaType = post.mediaType || 'image';

    if (mediaType.startsWith('video')) {
        return <video src={post.imageUrl} controls className="w-full object-cover aspect-video bg-black" />;
    }
    
    if (mediaType === 'youtube' && post.youtubeId) {
       return (
            <div className="w-full aspect-video bg-black">
                <iframe 
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${post.youtubeId}`} 
                    title="YouTube video player" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen>
                </iframe>
            </div>
       )
    }

    // Default to image
    return <Image src={post.imageUrl} alt={post.content || 'Post media'} width={700} height={700} className="w-full object-cover aspect-square" loading="lazy" />;
};

const PostComments = ({ post }: { post: any }) => {
  const [comment, setComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const user = auth.currentUser;
  const { toast } = useToast();

  const handlePostComment = async () => {
    if (!user || comment.trim() === "") return;
    setIsCommenting(true);

    const postRef = doc(db, "posts", post.id);
    const notificationRef = collection(db, "users", post.author.uid, "notifications");

    try {
      await updateDoc(postRef, {
        comments: arrayUnion({
          user: {
            name: user.displayName,
            avatar: user.photoURL,
            uid: user.uid,
          },
          text: comment,
          timestamp: serverTimestamp(),
        }),
        commentsCount: increment(1)
      });

      if (user.uid !== post.author.uid) {
        await addDoc(notificationRef, {
          type: "comment",
          from: {
            name: user.displayName,
            avatar: user.photoURL,
            uid: user.uid,
          },
          post: { id: post.id },
          comment: comment.length > 50 ? `${comment.substring(0, 50)}...` : comment,
          read: false,
          timestamp: serverTimestamp(),
        });
      }

      setComment("");

    } catch (err) {
      console.error("Error posting comment: ", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not post your comment.",
      });
    } finally {
      setIsCommenting(false);
    }
  };

  return (
    <>
      <p className="text-xs text-muted-foreground cursor-pointer hover:underline">
        View all {post.commentsCount || post.comments?.length || 0} comments
      </p>
      {post.comments?.slice(-2).map((c: any, index: number) => (
        <p key={index} className="text-sm">
          <Link href={`/profile/${c.user.uid}`} className="font-semibold mr-1 hover:underline">{c.user.name}</Link>
          {c.text}
        </p>
      ))}
      <div className="w-full flex items-center gap-2 pt-2">
        <Input
          placeholder="Add a comment..."
          className="bg-transparent border-none text-sm focus-visible:ring-0"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={isCommenting}
        />
        <Button variant="ghost" size="sm" onClick={handlePostComment} disabled={isCommenting || comment.trim() === ''}>
          {isCommenting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post"}
        </Button>
      </div>
    </>
  );
};


const LikeButton = ({ postId, authorId }: { postId: string, authorId: string }) => {
    const user = auth.currentUser;
    const likeRef = user ? doc(db, "posts", postId, "likes", user.uid) : null;
    const [likeDoc, loading, error] = useDocumentData(likeRef);

    const hasLiked = !!likeDoc;

    const handleLikePost = async () => {
        if (!user || !likeRef) return; 
        
        const postRef = doc(db, "posts", postId);
        const notificationRef = collection(db, "users", authorId, "notifications");

        try {
            if (hasLiked) {
                // Unlike
                await deleteDoc(likeRef);
                await updateDoc(postRef, { likesCount: increment(-1) });
            } else {
                // Like
                await setDoc(likeRef, { userId: user.uid });
                await updateDoc(postRef, { likesCount: increment(1) });
                
                // Do not send notification if liking your own post
                if(user.uid !== authorId) {
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
            }
        } catch (err) {
            console.error("Error liking post: ", err);
        }
    };
    
    if (loading) {
        return <Skeleton className="h-8 w-8" />;
    }

    return (
        <Button variant="ghost" size="icon" onClick={handleLikePost}>
            <Heart className={`h-6 w-6 ${hasLiked ? 'text-red-500 fill-red-500' : ''}`} />
        </Button>
    )
};

const PostMenu = ({ post }: { post: any }) => {
    const { toast } = useToast();
    const user = auth.currentUser;

    if (post.author.uid !== user?.uid) {
        return null; // Or a menu with "Report" etc.
    }

    const handleDeletePost = async () => {
        try {
            // Delete the post document from Firestore
            await deleteDoc(doc(db, "posts", post.id));

            // If the post had an image, delete it from Storage
            if (post.imageUrl && post.imageUrl.includes('firebasestorage')) {
                const imageRef = ref(storage, post.imageUrl);
                await deleteObject(imageRef);
            }

            toast({
                title: "Post Deleted",
                description: "Your post has been successfully removed.",
            });
        } catch (error) {
            console.error("Error deleting post: ", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not delete the post. Please try again.",
            });
        }
    };

    return (
        <AlertDialog>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <AlertDialogTrigger asChild>
                        <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                    </AlertDialogTrigger>
                </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your post and remove its data from our servers.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeletePost} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};


const AddStoryDialog = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isPosting, setIsPosting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const user = auth.currentUser;
    const { toast } = useToast();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onload = (e) => setImagePreview(e.target?.result as string);
            reader.readAsDataURL(file);
        } else {
            toast({ variant: "destructive", title: "Invalid File", description: "Please select an image file." });
        }
    };
    
    const reset = () => {
        setImageFile(null);
        setImagePreview(null);
        setIsPosting(false);
        setIsOpen(false);
        if(fileInputRef.current) fileInputRef.current.value = "";
    }

    const handleAddStory = async () => {
        if (!imageFile || !user) return;
        setIsPosting(true);

        try {
            const storageRef = ref(storage, `stories/${user.uid}/${Date.now()}_${imageFile.name}`);
            const uploadTask = await uploadBytesResumable(storageRef, imageFile);
            const downloadURL = await getDownloadURL(uploadTask.ref);

            await addDoc(collection(db, 'stories'), {
                author: {
                    name: user.displayName,
                    avatar: user.photoURL,
                    uid: user.uid,
                },
                imageUrl: downloadURL,
                timestamp: serverTimestamp(),
            });

            toast({ title: "Story Added!", description: "Your story is now visible to your family."});
            reset();
        } catch (error) {
            console.error("Error adding story: ", error);
            toast({ variant: "destructive", title: "Error", description: "Could not add your story." });
            setIsPosting(false);
        }
    };
    
    return (
         <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <div className="flex-shrink-0 flex flex-col items-center gap-2 w-[80px] text-left cursor-pointer">
                    <div className="relative w-[60px] h-[60px] flex items-center justify-center rounded-full bg-muted">
                        <Avatar className="w-[56px] h-[56px] border-2 border-background">
                            <AvatarImage src={user?.photoURL || undefined} />
                            <AvatarFallback>{user?.displayName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-0.5 border-2 border-background">
                            <Plus className="h-4 w-4" />
                        </div>
                    </div>
                     <p className="text-xs truncate w-full text-center">Your Story</p>
                </div>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add to your story</DialogTitle>
                    <DialogDescription>Share a photo that will be visible for 24 hours.</DialogDescription>
                </DialogHeader>
                {imagePreview ? (
                    <div className="space-y-4">
                        <Image src={imagePreview} alt="Story preview" width={400} height={700} className="rounded-md object-contain max-h-[60vh]" />
                        <div className="flex justify-end gap-2">
                             <Button variant="ghost" onClick={reset} disabled={isPosting}>Cancel</Button>
                             <Button onClick={handleAddStory} disabled={isPosting}>
                                {isPosting && <Loader2 className="mr-2 animate-spin"/>}
                                {isPosting ? "Sharing..." : "Share Story"}
                             </Button>
                        </div>
                    </div>
                ) : (
                    <div 
                        className="flex flex-col items-center justify-center border-2 border-dashed border-muted rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors mt-4"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <PlusCircle className="h-12 w-12 text-muted-foreground" />
                        <p className="mt-4 text-lg font-semibold">Select a photo to share</p>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept="image/*"
                        />
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )

}

export default function FeedPage() {
  const { toast } = useToast();
  const [user, setUser] = useState(auth.currentUser);
  const [postContent, setPostContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [postImageFile, setPostImageFile] = useState<File | null>(null);
  const [postImagePreview, setPostImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [following, setFollowing] = useState<string[]>([]);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);

  const [posts, setPosts] = useState<DocumentData[]>([]);
  const [lastVisible, setLastVisible] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const usersRef = collection(db, "users");
  const [usersSnapshot, usersLoading, usersError] = useCollection(usersRef);
  
  const twentyFourHoursAgo = useMemo(() => new Date(Date.now() - 24 * 60 * 60 * 1000), []);
  const storiesQuery = query(collection(db, "stories"), where("timestamp", ">", twentyFourHoursAgo), orderBy("timestamp", "desc"));
  const [storiesSnapshot, storiesLoading, storiesError] = useCollection(storiesQuery);

  const stories = useMemo(() => {
    if (!storiesSnapshot) return [];
    return storiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Story));
  }, [storiesSnapshot]);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
        const postsRef = collection(db, "posts");
        const q = query(postsRef, orderBy("timestamp", "desc"), limit(POSTS_PER_PAGE));
        
        const unsubscribe = onSnapshot(q, (documentSnapshots) => {
          const newPosts = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setPosts(newPosts);

          const lastDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];
          setLastVisible(lastDoc);

          if (documentSnapshots.empty || documentSnapshots.size < POSTS_PER_PAGE) {
              setHasMore(false);
          } else {
              setHasMore(true);
          }
          setLoading(false);
        }, (err) => {
            console.error("Error fetching posts:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    } catch(e) {
        console.error(e)
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
    const unsubPromise = fetchPosts();
    return () => {
      unsubPromise.then(cleanup => cleanup && cleanup());
    }
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
      setPostImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPostImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setPostImageFile(null);
    setPostImagePreview(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }


  const handleCreatePost = async () => {
    if ((postContent.trim() === "" && !postImageFile) || !user) return;

    setIsPosting(true);
    try {
      let imageUrl = "";
      let mediaType = "text";
      
      if (postImageFile) {
        mediaType = postImageFile.type.startsWith('video') ? 'video' : 'image';
        const storageRef = ref(storage, `posts/${user.uid}/${Date.now()}_${postImageFile.name}`);
        const uploadTask = uploadBytesResumable(storageRef, postImageFile);
        
        await uploadTask;
        imageUrl = await getDownloadURL(uploadTask.snapshot.ref);
      }

      await addDoc(collection(db, 'posts'), {
        author: {
          name: user.displayName,
          avatar: user.photoURL,
          uid: user.uid,
        },
        content: postContent,
        imageUrl: imageUrl,
        mediaType: mediaType,
        likesCount: 0,
        commentsCount: 0,
        timestamp: serverTimestamp(),
      });
      setPostContent("");
      removeImage();
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
    {selectedStory && <StoryViewer story={selectedStory} onClose={() => setSelectedStory(null)} />}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-4 md:p-6 max-w-6xl mx-auto">
        <div className="md:col-span-2 space-y-6">
            <div className="flex space-x-4 overflow-x-auto pb-4 -mx-4 px-4">
                {storiesLoading && [...Array(8)].map((_, i) => (
                    <div key={i} className="flex-shrink-0 flex flex-col items-center gap-2 w-[80px]">
                       <Skeleton className="w-[60px] h-[60px] rounded-full" />
                       <Skeleton className="h-3 w-16" />
                    </div>
                ))}

                <AddStoryDialog />

                {stories.filter(story => story.author.uid !== user?.uid).map(story => (
                    <button key={story.id} className="flex-shrink-0 flex flex-col items-center gap-2 w-[80px] text-left" onClick={() => setSelectedStory(story)}>
                        <div className="relative w-[60px] h-[60px]">
                          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 animate-spin-slow"></div>
                           <Avatar className="w-[56px] h-[56px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-background">
                                <AvatarImage src={story.author.avatar} />
                                <AvatarFallback>{story.author.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                        </div>
                        <p className="text-xs truncate w-full text-center">{story.author.name}</p>
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
                    {postImagePreview && (
                        <div className="relative w-fit mx-auto mb-4">
                            <Image src={postImagePreview} alt="Preview" width={400} height={400} className="rounded-md object-cover max-h-[300px]" loading="lazy" />
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
                            accept="image/*,video/*"
                        />
                        <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isPosting}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Media
                        </Button>
                        <Button onClick={handleCreatePost} disabled={isPosting || (postContent.trim() === '' && !postImageFile)}>
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
                            <Link href={`/profile/${post.author.uid}`}>
                                <Avatar>
                                    <AvatarImage src={post.author.avatar} />
                                    <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                            </Link>
                            <div>
                                <Link href={`/profile/${post.author.uid}`} className="font-semibold text-sm hover:underline">{post.author.name}</Link>
                                <p className="text-xs text-muted-foreground">
                                {post.timestamp ? formatDistanceToNow(post.timestamp.toDate(), { addSuffix: true }) : 'Just now'}
                                </p>
                            </div>
                        </div>
                        <PostMenu post={post} />
                    </div>
                </CardHeader>
                
                {post.imageUrl && (
                    <CardContent className="p-0">
                         <PostMedia post={post} />
                    </CardContent>
                )}
                <CardFooter className="flex flex-col items-start gap-2 p-4">
                     <div className="flex gap-2">
                        <LikeButton postId={post.id} authorId={post.author.uid} />
                         <Button variant="ghost" size="icon">
                            <MessageSquare className="h-6 w-6" />
                        </Button>
                     </div>
                     <p className="font-semibold text-sm">{post.likesCount || 0} likes</p>
                    {post.content && <p className="text-sm"><Link href={`/profile/${post.author.uid}`} className="font-semibold mr-1 hover:underline">{post.author.name}</Link>{post.content}</p>}
                    <PostComments post={post} />
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
                                    <Link href={`/profile/${suggUser.id}`} className="font-semibold text-sm hover:underline">{suggUser.name}</Link>
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
