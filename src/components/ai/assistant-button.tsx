"use client";

import { useState } from 'react';
import { Bot, Loader2, Send, Sparkles, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { askAssistant } from '@/ai/flows/assistant-chat';

interface Message {
  role: 'user' | 'model';
  content: { text: string }[];
}

export default function AssistantButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (input.trim() === '') return;

    const userMessage: Message = {
      role: 'user',
      content: [{ text: input }],
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await askAssistant({
        history: messages,
        prompt: input,
      });

      const modelMessage: Message = {
        role: 'model',
        content: [{ text: response.response }],
      };
      setMessages((prev) => [...prev, modelMessage]);
    } catch (error) {
      console.error('AI Assistant Error:', error);
      const errorMessage: Message = {
        role: 'model',
        content: [{ text: "I'm sorry, I encountered an error. Please try again." }],
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-green-600 hover:bg-green-700 shadow-lg animation-bounce-subtle"
        size="icon"
        onClick={() => setIsOpen(true)}
      >
        <Sparkles className="h-7 w-7" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px] grid-rows-[auto_1fr_auto] h-[70vh] max-h-[700px] p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <Bot />
              AI Assistant
            </DialogTitle>
            <DialogDescription>
              Ask me anything about how to use this application.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  {msg.role === 'model' && (
                    <Avatar className="h-8 w-8 bg-green-600 text-white">
                      <AvatarFallback><Bot size={20} /></AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`rounded-lg p-3 max-w-xs text-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    {msg.content[0].text}
                  </div>
                   {msg.role === 'user' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback><User size={20} /></AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isLoading && (
                 <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 bg-green-600 text-white">
                      <AvatarFallback><Bot size={20} /></AvatarFallback>
                    </Avatar>
                    <div className="rounded-lg p-3 max-w-xs text-sm bg-muted flex items-center">
                        <Loader2 className="h-5 w-5 animate-spin"/>
                    </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter className="p-4 border-t">
            <div className="w-full flex items-center gap-2">
              <Input
                placeholder="Ask a question..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={isLoading}
              />
              <Button onClick={handleSendMessage} disabled={isLoading}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
