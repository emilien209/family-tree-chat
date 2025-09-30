"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { PlusSquare, Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { db, auth, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";

export default function CreatePage() {
  const { toast } = useToast();
  const router = useRouter();
  const user = auth.currentUser;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mediaFile, setMediaFile] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setMediaFile(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeMedia = () => {
    setMediaFile(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleCreatePost = async () => {
    if (!mediaFile || !user) return;

    setIsPosting(true);
    try {
      const storageRef = ref(storage, `posts/${user.uid}/${Date.now()}`);
      const snapshot = await uploadString(storageRef, mediaFile, 'data_url');
      const imageUrl = await getDownloadURL(snapshot.ref);

      await addDoc(collection(db, "posts"), {
        author: {
          name: user.displayName,
          avatar: user.photoURL || `https://picsum.photos/seed/${user.uid}/40/40`,
          uid: user.uid,
        },
        content: caption,
        imageUrl: imageUrl,
        likes: 0,
        comments: [],
        timestamp: serverTimestamp(),
      });
      
      toast({
        title: "Post Created!",
        description: "Your post has been shared with the family.",
      });

      router.push('/feed');

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

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center h-16 shrink-0 border-b px-6">
        <div className="flex items-center gap-2">
          <PlusSquare className="h-6 w-6" />
          <h2 className="text-xl font-semibold font-headline">Create New Post</h2>
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center p-4 md:p-6">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>
              {mediaFile ? "Preview & Post" : "What would you like to share?"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mediaFile ? (
              <div className="space-y-4">
                <div className="relative w-full aspect-square">
                  <Image src={mediaFile} alt="Preview" fill className="rounded-md object-cover" />
                   <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={removeMedia}>
                      <X className="h-4 w-4" />
                   </Button>
                </div>
                <Textarea 
                  placeholder="Write a caption..." 
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  disabled={isPosting}
                />
              </div>
            ) : (
              <div 
                className="flex flex-col items-center justify-center border-2 border-dashed border-muted rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-lg font-semibold">Drag and drop photos or videos here</p>
                <p className="text-muted-foreground mt-1">or click to browse</p>
                <Button className="mt-6" asChild>
                    <span>Select from computer</span>
                </Button>
                 <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*,video/*"
                />
              </div>
            )}
          </CardContent>
          {mediaFile && (
            <CardFooter className="justify-end">
              <Button onClick={handleCreatePost} disabled={isPosting}>
                {isPosting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isPosting ? 'Sharing...' : 'Share Post'}
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
