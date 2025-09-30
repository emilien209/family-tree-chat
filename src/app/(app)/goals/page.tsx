"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Target, Wand2, PlusCircle, Lightbulb, Loader2, CheckCircle2 } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { generateIdeas } from "@/ai/flows/generate-ideas";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const ideaFormSchema = z.object({
    topic: z.string().min(5, { message: "Topic must be at least 5 characters." }),
});

const goalFormSchema = z.object({
    goal: z.string().min(10, { message: "Goal must be at least 10 characters." }),
});

interface Goal {
    id: number;
    text: string;
    completed: boolean;
}

const initialGoals: Goal[] = [
    { id: 1, text: "Save for a family vacation to the beach.", completed: false },
    { id: 2, text: "Start a family book club and read one book per month.", completed: true },
    { id: 3, text: "Volunteer together at a local charity once a quarter.", completed: false },
];

export default function GoalsPage() {
    const { toast } = useToast();
    const [generatedIdeas, setGeneratedIdeas] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [goals, setGoals] = useState<Goal[]>(initialGoals);

    const ideaForm = useForm<z.infer<typeof ideaFormSchema>>({
        resolver: zodResolver(ideaFormSchema),
        defaultValues: {
            topic: "Ways to improve our family's health and wellness",
        },
    });

    const goalForm = useForm<z.infer<typeof goalFormSchema>>({
        resolver: zodResolver(goalFormSchema),
        defaultValues: {
            goal: "",
        },
    });

    async function onIdeaSubmit(values: z.infer<typeof ideaFormSchema>) {
        setIsGenerating(true);
        setGeneratedIdeas([]);
        try {
            const result = await generateIdeas(values);
            setGeneratedIdeas(result.ideas);
        } catch (error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: "There was a problem generating ideas.",
            });
        } finally {
            setIsGenerating(false);
        }
    }

    function onGoalSubmit(values: z.infer<typeof goalFormSchema>) {
        const newGoal: Goal = {
            id: Date.now(),
            text: values.goal,
            completed: false,
        };
        setGoals([newGoal, ...goals]);
        goalForm.reset();
        toast({
            title: "Goal Added!",
            description: "A new family goal has been set.",
        });
    }

    function toggleGoal(id: number) {
        setGoals(goals.map(goal =>
            goal.id === id ? { ...goal, completed: !goal.completed } : goal
        ));
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
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-[1fr_420px]">
                    <Card>
                        <CardHeader>
                            <CardTitle>Our 2024 Goals</CardTitle>
                            <CardDescription>Here are the goals we're working towards as a family this year.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Form {...goalForm}>
                                <form onSubmit={goalForm.handleSubmit(onGoalSubmit)} className="flex items-center gap-2 mb-4">
                                    <FormField
                                        control={goalForm.control}
                                        name="goal"
                                        render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormControl>
                                                <Input placeholder="Add a new goal..." {...field} />
                                            </FormControl>
                                             <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                    <Button type="submit"><PlusCircle className="mr-2 h-4 w-4" /> Add Goal</Button>
                                </form>
                            </Form>
                            <Separator className="mb-4" />
                            <ScrollArea className="h-[400px]">
                                <div className="space-y-4 pr-4">
                                    {goals.map(goal => (
                                        <div key={goal.id} className={`flex items-start gap-3 p-3 rounded-md transition-colors ${goal.completed ? 'bg-muted/50 text-muted-foreground' : 'bg-card'}`}>
                                            <button onClick={() => toggleGoal(goal.id)}>
                                                {goal.completed ? 
                                                    <CheckCircle2 className="h-5 w-5 mt-0.5 text-primary" /> :
                                                    <div className="h-5 w-5 mt-0.5 rounded-full border-2 border-primary flex-shrink-0" />
                                                }
                                            </button>
                                            <p className={`flex-1 text-sm ${goal.completed ? 'line-through' : ''}`}>{goal.text}</p>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                 <Lightbulb className="h-6 w-6 text-accent" />
                                <CardTitle>AI Idea Generator</CardTitle>
                            </div>
                            <CardDescription>Stuck? Brainstorm ideas for family goals with AI.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Form {...ideaForm}>
                                <form onSubmit={ideaForm.handleSubmit(onIdeaSubmit)} className="space-y-4">
                                    <FormField
                                        control={ideaForm.control}
                                        name="topic"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Topic for Brainstorming</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="e.g., Family bonding activities"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit" disabled={isGenerating} className="w-full">
                                        {isGenerating ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Wand2 className="mr-2 h-4 w-4" />
                                        )}
                                        Generate Ideas
                                    </Button>
                                </form>
                            </Form>
                            <Separator className="my-6" />
                            <div className="space-y-4">
                                <h4 className="font-semibold">Generated Ideas</h4>
                                {isGenerating && (
                                    <div className="space-y-3">
                                        <Skeleton className="h-5 w-4/5" />
                                        <Skeleton className="h-5 w-full" />
                                        <Skeleton className="h-5 w-3/4" />
                                    </div>
                                )}
                                {!isGenerating && generatedIdeas.length === 0 && (
                                     <div className="text-center text-muted-foreground p-4 bg-muted/50 rounded-lg">
                                        <p>Your generated ideas will appear here.</p>
                                    </div>
                                )}
                                {generatedIdeas.length > 0 && (
                                    <ul className="space-y-3">
                                        {generatedIdeas.map((idea, index) => (
                                            <li key={index} className="flex items-start gap-3 text-sm">
                                                <Lightbulb className="h-4 w-4 mt-1 text-accent flex-shrink-0" />
                                                <span>{idea}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
