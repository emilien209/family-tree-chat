"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Clapperboard, Upload, X, Loader2, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

export default function ReelsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mediaFile, setMediaFile] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");

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
    if (!mediaFile) return;

    setIsPosting(true);
    // In a real app, you would upload the video file to Firebase Storage
    // and create a 'reels' document in Firestore.
    // For now, we'll just simulate the process.
    setTimeout(() => {
      toast({
        title: "Reel Shared!",
        description: "Your new reel is now available for the family to watch.",
      });
      setIsPosting(false);
      removeMedia();
      setCaption("");
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center h-16 shrink-0 border-b px-6">
        <div className="flex items-center gap-2">
          <Clapperboard className="h-6 w-6" />
          <h2 className="text-xl font-semibold font-headline">Share a Reel</h2>
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center p-4 md:p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>
              {mediaFile ? "Preview & Share" : "Upload a new reel"}
            </CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
          {mediaFile && (
            <CardFooter className="justify-end">
              <Button onClick={handleShareReel} disabled={isPosting}>
                {isPosting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isPosting ? 'Sharing...' : 'Share Reel'}
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
