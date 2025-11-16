
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
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

type MediaSource = {
  file: File | null;
  previewUrl: string;
  isUrl: boolean;
};

export default function CreatePage() {
  const { toast } = useToast();
  const router = useRouter();
  const user = auth.currentUser;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mediaSource, setMediaSource] = useState<MediaSource | null>(null);
  const [caption, setCaption] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setMediaSource({
          file: file,
          previewUrl: e.target?.result as string,
          isUrl: false
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlSubmit = async () => {
    if(imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
      setMediaSource({
        file: null,
        previewUrl: imageUrl,
        isUrl: true
      });
    } else {
        toast({
            variant: "destructive",
            title: "Invalid URL",
            description: "Please enter a valid image or video URL.",
        });
    }
  }

  const removeMedia = () => {
    setMediaSource(null);
    setImageUrl("");
    setUploadProgress(0);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const createFirestoreDoc = async (mediaUrl: string, mediaType: string) => {
    if (!user) return;
     try {
        await addDoc(collection(db, "posts"), {
            author: {
                name: user.displayName,
                avatar: user.photoURL,
                uid: user.uid,
            },
            content: caption,
            imageUrl: mediaUrl,
            mediaType: mediaType,
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
        console.error("Firestore error:", err);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not save post details. Please try again.",
        });
        throw err; // Re-throw to be caught by the caller
     }
  }


  const handleCreatePost = async () => {
    if (!mediaSource || !user) return;

    setIsPosting(true);
    setUploadProgress(0);

    try {
      if (!mediaSource.isUrl && mediaSource.file) {
        // Upload file from device
        const file = mediaSource.file;
        const storageRef = ref(storage, `posts/${user.uid}/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          (error) => {
            console.error("Upload failed:", error);
            toast({
              variant: "destructive",
              title: "Upload Error",
              description: "Could not upload your file. Please try again.",
            });
            setIsPosting(false);
          },
          async () => {
            try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                await createFirestoreDoc(downloadURL, file.type);
            } catch (finalError) {
                setIsPosting(false);
            }
          }
        );
      } else {
        // Use media from URL directly
        const mediaUrl = mediaSource.previewUrl;
        // Basic media type detection from URL extension
        let mediaType = 'image';
        if (/\.(mp4|webm|ogg)$/i.test(mediaUrl)) mediaType = 'video';
        await createFirestoreDoc(mediaUrl, mediaType);
      }
    } catch (err) {
      console.error("Error creating post: ", err);
      // Toast is handled in createFirestoreDoc or the upload error handler
      setIsPosting(false);
    }
  };

  const mediaType = mediaSource?.isUrl 
    ? (mediaSource.previewUrl.match(/\.(mp4|webm|ogg)$/i) ? 'video' : 'image') 
    : (mediaSource?.file?.type.startsWith('video/') ? 'video' : 'image');


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
              {mediaSource ? "Preview & Post" : "What would you like to share?"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mediaSource ? (
              <div className="space-y-4">
                <div className="relative w-full aspect-square bg-black rounded-md">
                   {mediaType === 'video' ? (
                        <video src={mediaSource.previewUrl} controls className="w-full h-full rounded-md object-contain" />
                    ) : (
                        <Image src={mediaSource.previewUrl} alt="Preview" fill className="rounded-md object-contain" />
                    )}
                   <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={removeMedia} disabled={isPosting}>
                      <X className="h-4 w-4" />
                   </Button>
                </div>
                { isPosting && !mediaSource.isUrl && <Progress value={uploadProgress} className="w-full mt-2" />}
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
          {mediaSource && (
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
