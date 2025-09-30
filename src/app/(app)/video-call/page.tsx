"use client";

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PhoneOff, Mic, MicOff, Video as VideoIcon, VideoOff, Users, ScreenShare, ScreenShareOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { auth } from '@/lib/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

const ParticipantVideo = ({ user, stream, isMuted, isVideoOff }: { user: any, stream?: MediaStream, isMuted?: boolean, isVideoOff?: boolean }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div className="relative aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
            <video ref={videoRef} className={cn("w-full h-full object-cover", isVideoOff && 'hidden')} autoPlay playsInline muted={isMuted} />
            {(isVideoOff || !stream) && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white">
                    <Avatar className="h-16 w-16">
                        <AvatarImage src={user?.photoURL || undefined}/>
                        <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <p className="mt-2 text-sm font-semibold">{user?.displayName || 'Participant'}</p>
                </div>
            )}
            {!isVideoOff && stream && (
                 <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-md">
                    {user?.displayName || 'Participant'}
                </div>
            )}
        </div>
    )
}


export default function VideoCallPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = auth.currentUser;

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  const isGroupCall = searchParams.get('type') === 'group';

  useEffect(() => {
    const getMedia = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({
          variant: 'destructive',
          title: 'Unsupported Browser',
          description: 'Your browser does not support video calls.',
        });
        setHasPermission(false);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        setHasPermission(true);
      } catch (error) {
        console.error('Error accessing media devices:', error);
        setHasPermission(false);
        toast({
          variant: 'destructive',
          title: 'Media Access Denied',
          description: 'Please enable camera and microphone permissions in your browser settings.',
        });
      }
    };

    getMedia();

    return () => {
        localStream?.getTracks().forEach(track => track.stop());
    }
  }, [toast]);

  const toggleMute = () => {
    localStream?.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
        setIsMuted(!track.enabled);
    });
  };

  const toggleVideo = () => {
     localStream?.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
        setIsVideoOff(!track.enabled);
    });
  };

  const toggleScreenShare = () => {
      // Screen sharing logic would be implemented here
      setIsScreenSharing(!isScreenSharing);
      toast({
          title: isScreenSharing ? "Screen sharing stopped" : "Screen sharing started",
          description: "This is a placeholder for screen sharing functionality."
      })
  }
  
  const handleLeaveCall = () => {
    localStream?.getTracks().forEach(track => track.stop());
    router.back();
  }

  // Dummy participants for group call layout
  const dummyParticipants = [
      { displayName: "Emile", photoURL: `https://picsum.photos/seed/1/200/200` },
      { displayName: "Josiane", photoURL: `https://picsum.photos/seed/2/200/200` },
      { displayName: "Aline", photoURL: `https://picsum.photos/seed/3/200/200` },
  ];

  return (
    <div className="flex h-screen w-full flex-col bg-muted text-foreground">
       <header className="flex items-center justify-between bg-background p-4 border-b shrink-0">
        <h1 className="text-xl font-bold">{isGroupCall ? 'Family Group Call' : 'Video Call'}</h1>
        <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <span className="font-semibold">{isGroupCall ? dummyParticipants.length + 1 : 1}</span>
        </div>
      </header>
      
      <main className="flex-1 p-4 overflow-auto">
        {hasPermission === false && (
            <div className="flex h-full items-center justify-center">
                 <Alert variant="destructive" className="max-w-sm">
                    <AlertTitle>Camera & Mic Required</AlertTitle>
                    <AlertDescription>
                        Please allow camera and microphone access to join the call. You may need to refresh after granting permissions.
                    </AlertDescription>
                </Alert>
            </div>
        )}

        {hasPermission === true && (
            <div className={cn("grid gap-4", 
                isGroupCall ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
            )}>
                <ParticipantVideo user={user} stream={localStream!} isMuted={true} isVideoOff={isVideoOff} />
                
                {isGroupCall && dummyParticipants.map((p, i) => (
                    // In a real app, stream would come from the remote peer
                    <ParticipantVideo key={i} user={p} isVideoOff={i % 2 === 0} /> 
                ))}

                 {!isGroupCall && (
                     <div className="relative aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                         <div className="text-center text-muted-foreground">
                            <p className="font-semibold text-lg">Waiting for others to join...</p>
                         </div>
                     </div>
                 )}
            </div>
        )}
      </main>

       <footer className="bg-background/80 backdrop-blur-sm p-4 flex justify-center items-center gap-4 border-t">
        <Button variant={isMuted ? "secondary" : "default"} size="icon" className="rounded-full h-12 w-12" onClick={toggleMute}>
            {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </Button>
        <Button variant={isVideoOff ? "secondary" : "default"} size="icon" className="rounded-full h-12 w-12" onClick={toggleVideo}>
            {isVideoOff ? <VideoOff className="h-6 w-6" /> : <VideoIcon className="h-6 w-6" />}
        </Button>
         <Button variant="secondary" size="icon" className="rounded-full h-12 w-12" onClick={toggleScreenShare}>
            {isScreenSharing ? <ScreenShareOff className="h-6 w-6" /> : <ScreenShare className="h-6 w-6" />}
        </Button>
         <Button variant="destructive" size="icon" className="rounded-full h-14 w-14" onClick={handleLeaveCall}>
            <PhoneOff className="h-7 w-7" />
        </Button>
      </footer>
    </div>
  );
}
