"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, X, Loader2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { assistantChat } from "@/ai/flows/assistant-chat";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Message {
  role: "user" | "bot";
  content: string;
}

export default function AiChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setMessages([
        { role: "bot", content: "Hello! I'm your family app assistant. How can I help you today? You can ask me how to use certain features or for ideas to improve the app." },
      ]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollAreaRef.current) {
        // A bit of a hack to scroll to the bottom.
        setTimeout(() => {
            const viewport = scrollAreaRef.current?.querySelector('div[data-radix-scroll-area-viewport]');
            if (viewport) {
                viewport.scrollTop = viewport.scrollHeight;
            }
        }, 100);
    }
  }, [messages]);


  const handleSend = async () => {
    if (input.trim() === "") return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const result = await assistantChat({ question: input });
      const botMessage: Message = { role: "bot", content: result.response };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
        console.error("AI Chat Error:", error);
      const errorMessage: Message = {
        role: "bot",
        content: "Sorry, I had trouble finding an answer. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }


  return (
    <>
      <Button
        className={cn(
          "fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg z-50 transition-transform duration-300",
          isOpen ? "scale-0" : "scale-100"
        )}
        style={{ backgroundColor: 'hsl(var(--primary))' }}
        size="icon"
        onClick={() => setIsOpen(true)}
      >
        <Bot className="h-8 w-8" />
      </Button>

      <Card
        className={cn(
          "fixed bottom-6 right-6 w-full max-w-sm h-full max-h-[600px] z-50 flex flex-col shadow-2xl transition-all duration-300 origin-bottom-right",
          isOpen
            ? "scale-100 opacity-100"
            : "scale-0 opacity-0"
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6" />
            <CardTitle className="text-lg">AI Assistant</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-start gap-3",
                    message.role === "user" && "justify-end"
                  )}
                >
                  {message.role === "bot" && (
                     <Avatar className="w-8 h-8 bg-primary text-primary-foreground">
                        <AvatarFallback><Bot size={18} /></AvatarFallback>
                    </Avatar>
                  )}
                  <div className={cn(
                    "rounded-lg px-3 py-2 text-sm max-w-[80%] prose prose-sm",
                    message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  )}>
                    {message.content.split('\n').map((line, i) => (
                        <span key={i}>{line}<br/></span>
                    ))}
                  </div>
                   {message.role === "user" && (
                    <Avatar className="w-8 h-8">
                        <AvatarFallback><User size={18} /></AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-3">
                   <Avatar className="w-8 h-8 bg-primary text-primary-foreground">
                        <AvatarFallback><Bot size={18} /></AvatarFallback>
                    </Avatar>
                  <p className="rounded-lg px-3 py-2 text-sm bg-muted">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter>
          <div className="relative w-full">
            <Input
              placeholder="Ask a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <Button
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={handleSend}
              disabled={isLoading || input.trim() === ''}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </>
  );
}
