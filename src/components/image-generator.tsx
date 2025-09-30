"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
import { generateFamilyImage } from "@/ai/flows/generate-family-image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Wand2, Loader2, Download } from "lucide-react";
import { Skeleton } from "./ui/skeleton";

const formSchema = z.object({
    prompt: z.string().min(10, { message: "Prompt must be at least 10 characters." }),
});

export default function ImageGenerator() {
    const { toast } = useToast();
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            prompt: "A happy family of four having a picnic in a sunny park, cartoon style.",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        setImageUrl(null);
        try {
            const result = await generateFamilyImage(values);
            setImageUrl(result.imageUrl);
            toast({
                title: "Image Generated!",
                description: "Your family image is ready.",
            });
        } catch (error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: "There was a problem generating your image.",
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>AI Image Generator</CardTitle>
                <CardDescription>
                    Create a unique, family-friendly image with AI. Use it for your profile, event invitations, or just for fun!
                </CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="prompt"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Image Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="e.g., A family portrait in a vintage style."
                                            className="min-h-[100px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={isLoading} className="w-full">
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Wand2 className="mr-2 h-4 w-4" />
                            )}
                            Generate Image
                        </Button>
                    </form>
                </Form>
                <div className="flex flex-col items-center justify-center bg-muted/50 rounded-lg p-4 aspect-square">
                    {isLoading && (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p>Generating your image...</p>
                             <Skeleton className="w-full h-full" />
                        </div>
                    )}
                    {!isLoading && imageUrl && (
                        <div className="relative group w-full h-full">
                            <Image
                                src={imageUrl}
                                alt="Generated family image"
                                fill
                                className="object-contain rounded-md"
                            />
                             <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="icon" asChild>
                                    <a href={imageUrl} target="_blank" download>
                                        <Download />
                                    </a>
                                </Button>
                            </div>
                        </div>
                    )}
                    {!isLoading && !imageUrl && (
                        <div className="text-center text-muted-foreground">
                            <Wand2 className="mx-auto h-12 w-12" />
                            <p className="mt-2">Your generated image will appear here.</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
