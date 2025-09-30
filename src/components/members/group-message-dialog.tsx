"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquarePlus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GroupMessageDialogProps {
  onSend: (message: string) => Promise<void>;
}

export function GroupMessageDialog({ onSend }: GroupMessageDialogProps) {
  const [message, setMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    if (message.trim() === '') return;
    setIsSending(true);
    try {
      await onSend(message);
      toast({
        title: 'Message Sent!',
        description: 'Your message has been sent to the family group chat.',
      });
      setMessage('');
      setIsOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error Sending Message',
        description: 'Could not send the group message. Please try again.',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <MessageSquarePlus className="mr-2 h-4 w-4" />
          Message All
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send a Message to Everyone</DialogTitle>
          <DialogDescription>
            This message will be sent to the family group chat and will be visible to all members.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            placeholder="Type your announcement here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSend} disabled={isSending || message.trim() === ''}>
            {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSending ? 'Sending...' : 'Send Message'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
