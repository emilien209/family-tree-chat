
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { auth, storage, db } from "@/lib/firebase";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc, collection, query, where, onSnapshot, orderBy, DocumentData } from "firebase/firestore";
import { ref, uploadString, getDownloadURL, uploadBytesResumable } from "firebase/storage";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Upload, User, Save, Grid, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

const profileFormSchema = z.object({
    fullName: z.string().min(2, "Name must be at least 2 characters."),
});

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


const EditProfileDialog = ({ user, onUpdate }: { user: any, onUpdate: () => void }) => {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [newAvatar, setNewAvatar] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState('');
    const [isOpen, setIsOpen] = useState(false);


    const profileForm = useForm<z.infer<typeof profileFormSchema>>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            fullName: user?.displayName || "",
        },
    });

    useEffect(() => {
        if (user) {
            profileForm.reset({ fullName: user.displayName || "" });
        }
    }, [user, profileForm]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setNewAvatar(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleUrlSubmit = () => {
        if(avatarUrl) {
            setNewAvatar(avatarUrl);
        }
    };

    const handleProfileUpdate = async (values: z.infer<typeof profileFormSchema>) => {
        if (!user) return;
        setIsUploading(true);

        try {
            let photoURL = user.photoURL;

            if (newAvatar) {
                if (newAvatar.startsWith('data:')) {
                    const storageRef = ref(storage, `avatars/${user.uid}/${Date.now()}`);
                    const snapshot = await uploadString(storageRef, newAvatar, 'data_url');
                    photoURL = await getDownloadURL(snapshot.ref);
                } else {
                    photoURL = newAvatar;
                }
            }

            await updateProfile(user, {
                displayName: values.fullName,
                photoURL: photoURL,
            });

            const userDocRef = doc(db, "users", user.uid);
            await updateDoc(userDocRef, {
                name: values.fullName,
                avatar: photoURL,
            });

            setNewAvatar(null);
            setAvatarUrl('');

            toast({
                title: "Profile Updated",
                description: "Your profile has been successfully updated.",
            });
            
            onUpdate();
            setIsOpen(false);

        } catch (error) {
            console.error("Error updating profile:", error);
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: "There was a problem updating your profile.",
            });
        } finally {
            setIsUploading(false);
        }
    };
    
    const currentAvatarSrc = newAvatar || user?.photoURL || '';

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="secondary">
                     <Settings className="mr-2 h-4 w-4" />
                    Edit Profile
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                </DialogHeader>
                <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-6 py-4">
                        <div className="flex items-center gap-6">
                            <Avatar className="h-24 w-24">
                                <AvatarImage src={currentAvatarSrc} />
                                <AvatarFallback>{user?.displayName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/*"
                            />
                            <Tabs defaultValue="upload" className="w-full max-w-sm">
                                <TabsList className="grid grid-cols-2">
                                    <TabsTrigger value="upload">Upload</TabsTrigger>
                                    <TabsTrigger value="url">URL</TabsTrigger>
                                </TabsList>
                                <TabsContent value="upload" className="mt-4">
                                    <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                                        <Upload className="mr-2 h-4 w-4" /> Upload Photo
                                    </Button>
                                </TabsContent>
                                <TabsContent value="url" className="mt-4">
                                        <div className="flex items-center space-x-2">
                                        <Input type="url" placeholder="Image URL" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
                                        <Button type="button" onClick={handleUrlSubmit}>Set</Button>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={profileForm.control}
                                name="fullName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Full Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Your full name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" defaultValue={user?.email || ""} disabled />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={isUploading}>
                                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

export default function ProfilePage() {
    const [user, setUser] = useState(auth.currentUser);
    const [posts, setPosts] = useState<DocumentData[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);


    const forceUpdate = useCallback(() => {
      setUser(null);
      setTimeout(() => setUser(auth.currentUser), 0);
    }, []);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(newUser => {
            setUser(newUser);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!user) return;

        setLoadingPosts(true);
        const postsRef = collection(db, "posts");
        const q = query(postsRef, where("author.uid", "==", user.uid), orderBy("timestamp", "desc"));

        const unsubPosts = onSnapshot(q, (snapshot) => {
            const userPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPosts(userPosts);
            setLoadingPosts(false);
        }, (error) => {
            console.error("Error fetching user posts:", error);
            setLoadingPosts(false);
        });

        const followersRef = collection(db, "users", user.uid, "followers");
        const unsubFollowers = onSnapshot(followersRef, (snapshot) => setFollowersCount(snapshot.size));

        const followingRef = collection(db, "users", user.uid, "following");
        const unsubFollowing = onSnapshot(followingRef, (snapshot) => setFollowingCount(snapshot.size));


        return () => {
            unsubPosts();
            unsubFollowers();
            unsubFollowing();
        };
    }, [user]);

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <header className="flex items-center gap-8 mb-8">
                     <Avatar className="h-24 w-24 md:h-36 md:w-36 border-4">
                        <AvatarImage src={user?.photoURL || undefined} />
                        <AvatarFallback className="text-4xl">{user?.displayName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                        <h1 className="text-2xl md:text-3xl font-bold">{user?.displayName}</h1>
                        <div className="flex gap-4 text-sm">
                            <p><span className="font-bold">{posts.length}</span> posts</p>
                            <p><span className="font-bold">{followersCount}</span> followers</p>
                            <p><span className="font-bold">{followingCount}</span> following</p>
                        </div>
                        {user && <EditProfileDialog user={user} onUpdate={forceUpdate} />}
                    </div>
                </header>

                <Separator />
                
                <Tabs defaultValue="posts" className="mt-8">
                    <TabsList className="grid w-full grid-cols-1 max-w-xs mx-auto">
                        <TabsTrigger value="posts"><Grid className="mr-2"/> Posts</TabsTrigger>
                        {/* Add other tabs like Reels, Saved here if needed */}
                    </TabsList>
                    <TabsContent value="posts" className="mt-6">
                        {loadingPosts && (
                            <div className="grid grid-cols-3 gap-1 md:gap-4">
                                <Skeleton className="aspect-square"/>
                                <Skeleton className="aspect-square"/>
                                <Skeleton className="aspect-square"/>
                            </div>
                        )}
                        {!loadingPosts && posts.length > 0 ? (
                            <div className="grid grid-cols-3 gap-1 md:gap-4">
                                {posts.map(post => <PostGridItem key={post.id} post={post} />)}
                            </div>
                        ) : (
                            !loadingPosts && (
                                <div className="text-center text-muted-foreground py-16">
                                    <h3 className="text-xl font-semibold">No Posts Yet</h3>
                                    <p>Share your first photo or video!</p>
                                </div>
                            )
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}

    