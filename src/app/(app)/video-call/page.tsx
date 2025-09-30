"use client";

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PhoneOff, Mic, MicOff, Video as VideoIcon, VideoOff, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function VideoCallPage() {
  const { toast } = useToast();
  const router = useRouter();
  const user = auth.currentUser;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  useEffect(() => {
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({
          variant: 'destructive',
          title: 'Unsupported Browser',
          description: 'Your browser does not support video calls.',
        });
        setHasCameraPermission(false);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this feature.',
        });
      }
    };

    getCameraPermission();

    return () => {
        // Clean up: stop media tracks when component unmounts
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, [toast]);

  const toggleMute = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
        setIsMuted(!track.enabled);
      });
    }
  };

  const toggleVideo = () => {
     if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
        setIsVideoOff(!track.enabled);
      });
    }
  };
  
  const handleLeaveCall = () => {
    router.back();
  }

  return (
    <div className="flex h-screen w-full flex-col bg-muted">
      <header className="flex items-center justify-between bg-background p-4 border-b">
        <h1 className="text-xl font-bold">Family Video Call</h1>
        <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <span className="font-semibold">1</span>
        </div>
      </header>
      <main className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 p-4">
        {/* Main Video (self) */}
        <div className="md:col-span-3 rounded-lg overflow-hidden bg-background shadow-lg relative">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
             {isVideoOff && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
                    <Avatar className="h-24 w-24">
                        <AvatarImage src={user?.photoURL || undefined}/>
                        <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <p className="mt-4 text-white font-semibold">Video is off</p>
                </div>
            )}
            {hasCameraPermission === false && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                    <Alert variant="destructive" className="max-w-sm">
                        <AlertTitle>Camera Access Required</AlertTitle>
                        <AlertDescription>
                            Please allow camera access in your browser to use this feature. You may need to refresh the page after granting permission.
                        </AlertDescription>
                    </Alert>
                </div>
            )}
            <div className="absolute bottom-4 left-4 bg-black/50 text-white text-sm px-2 py-1 rounded-md">
                {user?.displayName || 'You'}
            </div>
        </div>
        {/* Other participants */}
        <div className="hidden md:flex flex-col gap-4">
            <Card className="flex-1">
                <CardHeader>
                    <CardTitle className="text-base">Participants</CardTitle>
                </CardHeader>
                 <CardContent className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground text-sm">Other participants will appear here</p>
                </CardContent>
            </Card>
        </div>
      </main>
       <footer className="bg-background/80 backdrop-blur-sm p-4 flex justify-center items-center gap-4 border-t">
        <Button variant={isMuted ? "destructive" : "secondary"} size="icon" className="rounded-full h-12 w-12" onClick={toggleMute}>
            {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </Button>
        <Button variant={isVideoOff ? "destructive" : "secondary"} size="icon" className="rounded-full h-12 w-12" onClick={toggleVideo}>
            {isVideoOff ? <VideoOff className="h-6 w-6" /> : <VideoIcon className="h-6 w-6" />}
        </Button>
         <Button variant="destructive" size="icon" className="rounded-full h-14 w-14" onClick={handleLeaveCall}>
            <PhoneOff className="h-7 w-7" />
        </Button>
      </footer>
    </div>
  );
}
