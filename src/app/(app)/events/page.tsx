
"use client";

import { useState, useEffect } from "react";
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PlusCircle, MapPin, Calendar as CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";


const eventFormSchema = z.object({
    title: z.string().min(3, { message: "Title must be at least 3 characters." }),
    location: z.string().min(2, { message: "Location is required." }),
    date: z.date({ required_error: "A date is required." }),
    time: z.string().min(1, { message: "Time is required." }),
});

const EventSkeleton = () => (
    <Card>
        <CardHeader>
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
            <Skeleton className="h-4 w-1/3" />
        </CardContent>
    </Card>
);

export default function EventsPage() {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [open, setOpen] = useState(false);

    const eventsRef = collection(db, "events");
    const q = query(eventsRef, orderBy("date", "desc"));
    const [eventsSnapshot, loading, error] = useCollection(q);

    const form = useForm<z.infer<typeof eventFormSchema>>({
        resolver: zodResolver(eventFormSchema),
        defaultValues: {
            title: "",
            location: "",
            time: "",
        },
    });

    async function onSubmit(values: z.infer<typeof eventFormSchema>) {
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, "events"), {
                ...values,
                timestamp: serverTimestamp(),
            });
            toast({
                title: "Event Created!",
                description: "The new event has been added to the family calendar.",
            });
            form.reset();
            setOpen(false);
        } catch (err) {
            console.error(err);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not create the event. Please try again.",
            });
        } finally {
            setIsSubmitting(false);
        }
    }


  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between h-16 shrink-0 border-b px-6">
        <h2 className="text-xl font-semibold font-headline">Family Events</h2>
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Event
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create New Event</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Event Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Dad's Birthday BBQ" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                <FormLabel>Date</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full pl-3 text-left font-normal",
                                            !field.value && "text-muted-foreground"
                                        )}
                                        >
                                        {field.value ? (
                                            format(field.value, "PPP")
                                        ) : (
                                            <span>Pick a date</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        initialFocus
                                    />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="time"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Time</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., 2:00 PM" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="location"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Location</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Backyard" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">
                                Cancel
                                </Button>
                            </DialogClose>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Event
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
      </header>
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-[1fr_380px]">
          <Card>
             <CardContent className="p-2">
              <Calendar
                mode="single"
                selected={new Date()}
                className="rounded-md"
              />
            </CardContent>
          </Card>
          <div className="space-y-4">
             <h3 className="text-lg font-semibold font-headline">Upcoming Events</h3>
             {loading && (
                <div className="space-y-4">
                    <EventSkeleton />
                    <EventSkeleton />
                    <EventSkeleton />
                </div>
             )}
             {error && (
                 <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>Could not load events. Please try again.</AlertDescription>
                </Alert>
             )}
            {!loading && eventsSnapshot?.docs.map((doc) => {
                const event = doc.data();
                return (
                    <Card key={doc.id}>
                        <CardHeader>
                        <CardTitle>{event.title}</CardTitle>
                        <CardDescription>
                            {event.date ? format(event.date.toDate(), "PPP") : ''} • {event.time}
                        </CardDescription>
                        </CardHeader>
                        <CardContent>
                        <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="mr-2 h-4 w-4" />
                            <span>{event.location}</span>
                        </div>
                        </CardContent>
                    </Card>
                )
            })}
             {!loading && eventsSnapshot?.empty && (
                <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                        <p>No upcoming events.</p>
                        <p className="text-sm">Create one to get started!</p>
                    </CardContent>
                </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
