
"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { PlusSquare, Upload, X, Loader2, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { db, auth, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

export default function CreatePage() {
  const { toast } = useToast();
  const router = useRouter();
  const user = auth.currentUser;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mediaFile, setMediaFile] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setMediaType(file.type);
      const reader = new FileReader();
      reader.onload = (e) => {
        setMediaFile(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlSubmit = () => {
    if(imageUrl) {
        setMediaFile(imageUrl);
        setMediaType(imageUrl.includes('mp4') ? 'video/mp4' : 'image');
    }
  }

  const removeMedia = () => {
    setMediaFile(null);
    setMediaType(null);
    setImageUrl("");
    setUploadProgress(0);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleCreatePost = async () => {
    if (!mediaFile || !user) return;

    setIsPosting(true);
    setUploadProgress(0);
    try {
        let finalImageUrl = mediaFile;
        
        if (mediaFile.startsWith('data:')) {
             const storageRef = ref(storage, `posts/${user.uid}/${Date.now()}`);
             const uploadTask = uploadString(storageRef, mediaFile, 'data_url');
             
            // We're not using the progress from uploadString, so we'll just simulate it for now.
             setUploadProgress(50);
             const snapshot = await uploadTask;
             finalImageUrl = await getDownloadURL(snapshot.ref);
             setUploadProgress(100);

        }
        await createFirestoreDoc(finalImageUrl);
      
    } catch (err) {
      console.error("Error creating post: ", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not create post. Please try again.",
      });
      setIsPosting(false);
    }
  };

  const createFirestoreDoc = async (imageUrl: string) => {
    if (!user) return;
     await addDoc(collection(db, "posts"), {
        author: {
          name: user.displayName,
          avatar: user.photoURL,
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
      setIsPosting(false);
  }

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
                <div className="relative w-full aspect-square bg-black rounded-md">
                   {mediaType?.startsWith('video/') ? (
                        <video src={mediaFile} controls className="w-full h-full rounded-md object-contain" />
                    ) : (
                        <Image src={mediaFile} alt="Preview" fill className="rounded-md object-contain" />
                    )}
                   <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={removeMedia} disabled={isPosting}>
                      <X className="h-4 w-4" />
                   </Button>
                </div>
                { isPosting && <Progress value={uploadProgress} className="w-full mt-2" />}
                <Textarea 
                  placeholder="Write a caption..." 
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  disabled={isPosting}
                />
              </div>
            ) : (
                <Tabs defaultValue="upload" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="upload">Upload</TabsTrigger>
                        <TabsTrigger value="url">From URL</TabsTrigger>
                    </TabsList>
                    <TabsContent value="upload">
                        <div 
                            className="flex flex-col items-center justify-center border-2 border-dashed border-muted rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors mt-4"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="h-12 w-12 text-muted-foreground" />
                            <p className="mt-4 text-lg font-semibold">Drag and drop or click to browse</p>
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
                    </TabsContent>
                    <TabsContent value="url">
                         <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted rounded-lg p-12 text-center mt-4">
                            <LinkIcon className="h-12 w-12 text-muted-foreground" />
                            <p className="mt-4 text-lg font-semibold">Paste an image or video URL</p>
                            <div className="flex w-full max-w-sm items-center space-x-2 mt-4">
                                <Input type="url" placeholder="https://example.com/media.png" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
                                <Button type="button" onClick={handleUrlSubmit}>Add</Button>
                            </div>
                         </div>
                    </TabsContent>
                </Tabs>
              
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

    