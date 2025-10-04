
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, PlusCircle, Loader2, CheckCircle2 } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollection } from "react-firebase-hooks/firestore";
import { db } from "@/lib/firebase";
import { collection, query, addDoc, serverTimestamp, orderBy, doc, updateDoc } from 'firebase/firestore';

const goalFormSchema = z.object({
    text: z.string().min(10, { message: "Goal must be at least 10 characters." }),
});

interface Goal {
    id: string;
    text: string;
    completed: boolean;
}

export default function GoalsPage() {
    const { toast } = useToast();
    const [isSubmittingGoal, setIsSubmittingGoal] = useState(false);

    const goalsRef = collection(db, "goals");
    const q = query(goalsRef, orderBy("timestamp", "desc"));
    const [goalsSnapshot, loading, error] = useCollection(q);

    const goalForm = useForm<z.infer<typeof goalFormSchema>>({
        resolver: zodResolver(goalFormSchema),
        defaultValues: {
            text: "",
        },
    });

    async function onGoalSubmit(values: z.infer<typeof goalFormSchema>) {
        setIsSubmittingGoal(true);
        try {
             await addDoc(goalsRef, {
                text: values.text,
                completed: false,
                timestamp: serverTimestamp(),
            });
            goalForm.reset();
            toast({
                title: "Goal Added!",
                description: "A new family goal has been set.",
            });
        } catch (err) {
            console.error(err);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not add goal. Please try again.",
            });
        } finally {
            setIsSubmittingGoal(false);
        }
    }

    async function toggleGoal(id: string, completed: boolean) {
        const goalRef = doc(db, "goals", id);
        try {
            await updateDoc(goalRef, { completed: !completed });
        } catch(err) {
            console.error(err);
             toast({
                variant: "destructive",
                title: "Error",
                description: "Could not update goal status.",
            });
        }
    }


    return (
        <div className="flex flex-col h-full">
            <header className="flex items-center h-16 shrink-0 border-b px-6">
                <div className="flex items-center gap-2">
                    <Target className="h-6 w-6" />
                    <h2 className="text-xl font-semibold font-headline">Family Goals</h2>
                </div>
            </header>
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="max-w-2xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle>Our Shared Goals</CardTitle>
                            <CardDescription>Here are the goals we're working towards as a family.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Form {...goalForm}>
                                <form onSubmit={goalForm.handleSubmit(onGoalSubmit)} className="flex items-center gap-2 mb-4">
                                    <FormField
                                        control={goalForm.control}
                                        name="text"
                                        render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormControl>
                                                <Input placeholder="Add a new goal..." {...field} disabled={isSubmittingGoal}/>
                                            </FormControl>
                                             <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                    <Button type="submit" disabled={isSubmittingGoal}>
                                        {isSubmittingGoal ? <Loader2 className="h-4 w-4 animate-spin"/> : <PlusCircle className="mr-2 h-4 w-4" />} 
                                        {isSubmittingGoal ? 'Adding...' : 'Add Goal'}
                                    </Button>
                                </form>
                            </Form>
                            <Separator className="mb-4" />
                            <ScrollArea className="h-[400px]">
                                <div className="space-y-4 pr-4">
                                    {loading && [...Array(3)].map((_, i) => (
                                        <div key={i} className="flex items-start gap-3 p-3">
                                            <Skeleton className="h-5 w-5 rounded-full mt-0.5" />
                                            <Skeleton className="h-5 w-4/5" />
                                        </div>
                                    ))}
                                    {goalsSnapshot?.docs.map(doc => {
                                        const goal = { id: doc.id, ...doc.data() } as Goal;
                                        return (
                                            <div key={goal.id} className={`flex items-start gap-3 p-3 rounded-md transition-colors ${goal.completed ? 'bg-muted/50 text-muted-foreground' : 'bg-card'}`}>
                                                <button onClick={() => toggleGoal(goal.id, goal.completed)}>
                                                    {goal.completed ? 
                                                        <CheckCircle2 className="h-5 w-5 mt-0.5 text-primary" /> :
                                                        <div className="h-5 w-5 mt-0.5 rounded-full border-2 border-primary flex-shrink-0" />
                                                    }
                                                </button>
                                                <p className={`flex-1 text-sm ${goal.completed ? 'line-through' : ''}`}>{goal.text}</p>
                                            </div>
                                        )
                                    })}
                                    {!loading && goalsSnapshot?.empty && (
                                        <div className="text-center text-muted-foreground p-4">
                                            <p>No family goals have been set yet.</p>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
