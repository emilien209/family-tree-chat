"use client"

import { Send, Paperclip } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export default function MessageInput() {
    return (
        <div className="relative">
            <Textarea
                placeholder="Type your message..."
                className="w-full resize-none rounded-lg pr-24 py-3"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
                <Button variant="ghost" size="icon">
                    <Paperclip className="h-5 w-5" />
                    <span className="sr-only">Attach file</span>
                </Button>
                <Button size="icon">
                    <Send className="h-5 w-5" />
                    <span className="sr-only">Send message</span>
                </Button>
            </div>
        </div>
    )
}
