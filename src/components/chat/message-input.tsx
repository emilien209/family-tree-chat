"use client"

import { useState } from "react";
import { Send, Paperclip } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface MessageInputProps {
    chatId?: string | null;
}

export default function MessageInput({ chatId }: MessageInputProps) {
    const [message, setMessage] = useState("");
    const { toast } = useToast();

    const sendMessage = async () => {
        if (message.trim() === "" || !auth.currentUser || !chatId) return;

        // Determine if it's a private chat or group chat
        const collectionPath = chatId === 'group' 
            ? `chats/group/messages` 
            : `chats/private/${chatId}/messages`;

        try {
            await addDoc(collection(db, collectionPath), {
                text: message,
                timestamp: serverTimestamp(),
                user: {
                    name: auth.currentUser.displayName || "Anonymous",
                    avatar: auth.currentUser.photoURL,
                    uid: auth.currentUser.uid,
                },
            });
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

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }


    return (
        <div className="relative">
            <Textarea
                placeholder="Type your message..."
                className="w-full resize-none rounded-lg pr-24 py-3"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!chatId}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
                <Button variant="ghost" size="icon" disabled={!chatId}>
                    <Paperclip className="h-5 w-5" />
                    <span className="sr-only">Attach file</span>
                </Button>
                <Button size="icon" onClick={sendMessage} disabled={!chatId || message.trim() === ""}>
                    <Send className="h-5 w-5" />
                    <span className="sr-only">Send message</span>
                </Button>
            </div>
        </div>
    )
}
