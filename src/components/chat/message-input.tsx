
"use client"

import { useState, useRef } from "react";
import { Send, Paperclip } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast";
import { db, auth, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, runTransaction, getDocs } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";

interface MessageInputProps {
    chatId?: string | null;
    otherUserId?: string | null;
}

export default function MessageInput({ chatId, otherUserId }: MessageInputProps) {
    const [message, setMessage] = useState("");
    const { toast } = useToast();
    const currentUser = auth.currentUser;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const incrementUnreadCount = async () => {
        if (!chatId || !currentUser) return;
        
        if (chatId === 'group') {
             // For group chat, increment unread count for all other users
             const usersRef = collection(db, 'users');
             const usersSnapshot = await getDocs(usersRef);
             usersSnapshot.forEach(userDoc => {
                 if (userDoc.id !== currentUser.uid) {
                     const unreadCountRef = doc(db, 'users', userDoc.id, 'unreadCounts', 'group');
                     runTransaction(db, async (transaction) => {
                         const unreadDoc = await transaction.get(unreadCountRef);
                         const newCount = (unreadDoc.data()?.count || 0) + 1;
                         transaction.set(unreadCountRef, { count: newCount });
                     });
                 }
             });

        } else if (otherUserId) {
            // For private chat, increment for the other user
            const unreadCountRef = doc(db, 'users', otherUserId, 'unreadCounts', currentUser.uid);
            await runTransaction(db, async (transaction) => {
                const unreadDoc = await transaction.get(unreadCountRef);
                const newCount = (unreadDoc.data()?.count || 0) + 1;
                transaction.set(unreadCountRef, { count: newCount });
            });
        }
    };


    const sendMessage = async (imageUrl = "") => {
        if ((message.trim() === "" && !imageUrl) || !currentUser || !chatId) return;

        const collectionPath = chatId === 'group' 
            ? `chats/group/messages` 
            : `privateChats/${chatId}/messages`;

        try {
            await addDoc(collection(db, collectionPath), {
                text: message,
                imageUrl: imageUrl,
                timestamp: serverTimestamp(),
                user: {
                    name: currentUser.displayName || "Anonymous",
                    avatar: currentUser.photoURL,
                    uid: currentUser.uid,
                },
            });
            await incrementUnreadCount();
            setMessage("");
        } catch (error) {
            console.error("Error sending message: ", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not send message. Please try again.",
            });
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !currentUser || !chatId) return;
        
        toast({ title: "Uploading...", description: "Your image is being uploaded." });

        try {
            const storageRef = ref(storage, `chatMedia/${chatId}/${Date.now()}_${file.name}`);
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async (e) => {
                const dataUrl = e.target?.result as string;
                const snapshot = await uploadString(storageRef, dataUrl, 'data_url');
                const downloadURL = await getDownloadURL(snapshot.ref);
                await sendMessage(downloadURL);
                 toast({ title: "Image Sent!", description: "Your image has been sent successfully." });
            }
        } catch (error) {
             console.error("Error uploading image: ", error);
             toast({
                variant: "destructive",
                title: "Upload Error",
                description: "Could not send the image.",
            });
        }
    };


    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }


    return (
        <div className="relative">
             <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
            />
            <Textarea
                placeholder="Type your message..."
                className="w-full resize-none rounded-lg pr-24 py-3"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!chatId}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
                <Button variant="ghost" size="icon" disabled={!chatId} onClick={() => fileInputRef.current?.click()}>
                    <Paperclip className="h-5 w-5" />
                    <span className="sr-only">Attach file</span>
                </Button>
                <Button size="icon" onClick={() => sendMessage()} disabled={!chatId || message.trim() === ""}>
                    <Send className="h-5 w-5" />
                    <span className="sr-only">Send message</span>
                </Button>
            </div>
        </div>
    )
}

    