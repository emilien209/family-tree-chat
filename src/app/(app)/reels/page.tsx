"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Clapperboard, Upload, X, Loader2, Link as LinkIcon, Heart, MessageCircle, Send, Plus, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { db, auth, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, DocumentData } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

const ReelItem = ({ reel }: { reel: DocumentData }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(true);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    return (
        <div className="h-full w-full snap-start relative flex items-center justify-center bg-black">
            <video
                ref={videoRef}
                src={reel.videoUrl}
                loop
                autoPlay
                playsInline
                onClick={togglePlay}
                className="w-full h-full object-contain"
            />
            <div className="absolute bottom-0 left-0 p-4 text-white w-full bg-gradient-to-t from-black/50 to-transparent">
                <div className="flex items-center gap-2">
                    <Avatar>
                        <AvatarImage src={reel.author.avatar} />
                        <AvatarFallback>{reel.author.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <p className="font-bold">{reel.author.name}</p>
                </div>
                <p className="mt-2 text-sm">{reel.caption}</p>
                 <div className="flex items-center gap-2 mt-2 text-sm">
                    <Music className="h-4 w-4" />
                    <p>Original Audio</p>
                </div>
            </div>
            <div className="absolute right-2 bottom-4 flex flex-col gap-4 text-white items-center">
                 <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                    <Heart className="h-8 w-8" />
                    <span className="text-xs">1.2M</span>
                </Button>
                 <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                    <MessageCircle className="h-8 w-8" />
                    <span className="text-xs">3,456</span>
                </Button>
                 <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                    <Send className="h-8 w-8" />
                </Button>
                 <Avatar className="h-10 w-10 border-2 border-white mt-4">
                    <AvatarImage src={reel.author.avatar} />
                    <AvatarFallback>{reel.author.name.charAt(0)}</AvatarFallback>
                 </Avatar>
            </div>
        </div>
    );
};


const UploadReelDialog = ({ onUploadSuccess }: { onUploadSuccess: () => void }) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mediaFile, setMediaFile] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const user = auth.currentUser;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("video/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setMediaFile(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
        toast({
            variant: "destructive",
            title: "Invalid File Type",
            description: "Please select a video file.",
        });
    }
  };

  const handleUrlSubmit = () => {
    if(videoUrl) {
        setMediaFile(videoUrl);
    }
  }

  const removeMedia = () => {
    setMediaFile(null);
    setVideoUrl("");
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleShareReel = async () => {
    if (!mediaFile || !user) return;
    setIsPosting(true);
    
    try {
        let finalVideoUrl = mediaFile;
        if(mediaFile.startsWith('data:')){
            const storageRef = ref(storage, `reels/${user.uid}/${Date.now()}`);
            const snapshot = await uploadString(storageRef, mediaFile, 'data_url');
            finalVideoUrl = await getDownloadURL(snapshot.ref);
        }

        await addDoc(collection(db, "reels"), {
            author: {
                name: user.displayName,
                avatar: user.photoURL,
                uid: user.uid,
            },
            caption: caption,
            videoUrl: finalVideoUrl,
            likes: 0,
            comments: [],
            timestamp: serverTimestamp(),
        });
      
        toast({
            title: "Reel Shared!",
            description: "Your new reel is now available for the family to watch.",
        });
        
        removeMedia();
        setCaption("");
        onUploadSuccess();

    } catch (err) {
        console.error("Error sharing reel: ", err);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not share reel. Please try again.",
        });
    } finally {
        setIsPosting(false);
    }
  };

  return (
    <DialogContent className="max-w-md">
        <DialogHeader>
            <DialogTitle>
            {mediaFile ? "Preview & Share" : "Upload a new reel"}
            </DialogTitle>
        </DialogHeader>
        <div className="pt-4">
        {mediaFile ? (
            <div className="space-y-4">
            <div className="relative w-full aspect-[9/16] bg-black rounded-lg">
                <video src={mediaFile} controls className="w-full h-full rounded-md" />
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
                        <p className="mt-4 text-lg font-semibold">Click to browse or drag & drop</p>
                        <Button className="mt-6" asChild>
                            <span>Select video</span>
                        </Button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept="video/*"
                        />
                    </div>
                </TabsContent>
                <TabsContent value="url">
                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted rounded-lg p-12 text-center mt-4">
                        <LinkIcon className="h-12 w-12 text-muted-foreground" />
                        <p className="mt-4 text-lg font-semibold">Paste a video URL</p>
                        <div className="flex w-full max-w-sm items-center space-x-2 mt-4">
                            <Input type="url" placeholder="https://example.com/video.mp4" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
                            <Button type="button" onClick={handleUrlSubmit}>Add</Button>
                        </div>
                        </div>
                </TabsContent>
            </Tabs>
        )}
        </div>
        {mediaFile && (
        <DialogFooter>
            <Button onClick={handleShareReel} disabled={isPosting} className="w-full">
            {isPosting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isPosting ? 'Sharing...' : 'Share Reel'}
            </Button>
        </DialogFooter>
        )}
    </DialogContent>
  );
}


export default function ReelsPage() {
    const [reels, setReels] = useState<DocumentData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    useEffect(() => {
        const q = query(collection(db, "reels"), orderBy("timestamp", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setReels(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        }, (err) => {
            console.error("Error fetching reels: ", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleUploadSuccess = () => {
        setIsUploadOpen(false);
    };

    if(loading) {
        return <div className="h-screen w-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

  return (
    <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
    <div className="h-screen w-screen bg-black relative">
        <header className="absolute top-0 left-0 w-full z-10 p-4 flex justify-between items-center text-white bg-gradient-to-b from-black/50 to-transparent">
            <h1 className="text-xl font-bold">Reels</h1>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                    <Plus className="h-6 w-6"/>
                </Button>
            </DialogTrigger>
        </header>

        {reels.length > 0 ? (
            <div className="h-full w-full snap-y snap-mandatory overflow-y-auto">
                {reels.map(reel => (
                    <ReelItem key={reel.id} reel={reel} />
                ))}
            </div>
        ) : (
            <div className="h-full w-full flex flex-col items-center justify-center text-white gap-4">
                <Clapperboard className="h-16 w-16" />
                <h2 className="text-2xl font-bold">No Reels Yet</h2>
                <p className="text-muted-foreground">Be the first one to share a reel!</p>
                <DialogTrigger asChild>
                    <Button>
                        <Plus className="mr-2"/> Upload Reel
                    </Button>
                </DialogTrigger>
            </div>
        )}
      
        <UploadReelDialog onUploadSuccess={handleUploadSuccess}/>
    </div>
    </Dialog>
  );
}
