"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { auth, storage } from "@/lib/firebase";
import { updateProfile } from "firebase/auth";
import { ref, uploadString, getDownloadURL } from "firebase/storage";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateFamilyImage } from "@/ai/flows/generate-family-image";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Wand2, Loader2, Upload, User, Save } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const profileFormSchema = z.object({
    fullName: z.string().min(2, "Name must be at least 2 characters."),
});

const imagePromptSchema = z.object({
    prompt: z.string().min(10, { message: "Prompt must be at least 10 characters." }),
});

export default function ProfilePage() {
    const { toast } = useToast();
    const user = auth.currentUser;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [newAvatar, setNewAvatar] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

    const profileForm = useForm<z.infer<typeof profileFormSchema>>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            fullName: user?.displayName || "",
        },
    });

    const imagePromptForm = useForm<z.infer<typeof imagePromptSchema>>({
        resolver: zodResolver(imagePromptSchema),
        defaultValues: {
            prompt: "A happy person smiling, in a photorealistic style.",
        },
    });

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setNewAvatar(e.target?.result as string);
                setGeneratedImageUrl(null); // Clear generated image if a file is chosen
            };
            reader.readAsDataURL(file);
        }
    };

    const handleProfileUpdate = async (values: z.infer<typeof profileFormSchema>) => {
        if (!user) return;
        setIsUploading(true);

        try {
            let photoURL = user.photoURL;

            // If a new avatar (from file or generator) is set, upload it
            if (newAvatar) {
                const storageRef = ref(storage, `avatars/${user.uid}/${Date.now()}`);
                const snapshot = await uploadString(storageRef, newAvatar, 'data_url');
                photoURL = await getDownloadURL(snapshot.ref);
            }

            // Update profile with new name and/or photo
            await updateProfile(user, {
                displayName: values.fullName,
                photoURL: photoURL,
            });

            setNewAvatar(null);
            setGeneratedImageUrl(null);

            toast({
                title: "Profile Updated",
                description: "Your profile has been successfully updated.",
            });

            // Force a reload of the user to get the latest profile data
            await user.reload(); 
            // This is a simple way to force re-render, a better way is to use a global state
            window.location.reload();

        } catch (error) {
            console.error("Error updating profile:", error);
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: "There was a problem updating your profile.",
            });
        } finally {
            setIsUploading(false);
        }
    };
    
    async function onImagePromptSubmit(values: z.infer<typeof imagePromptSchema>) {
        setIsGenerating(true);
        setGeneratedImageUrl(null);
        try {
            const result = await generateFamilyImage(values);
            setGeneratedImageUrl(result.imageUrl);
            setNewAvatar(result.imageUrl); // Set as the new avatar to be uploaded
            toast({
                title: "Image Generated!",
                description: "Your new avatar is ready. Save changes to apply.",
            });
        } catch (error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: "There was a problem generating your image.",
            });
        } finally {
            setIsGenerating(false);
        }
    }


    const currentAvatarSrc = newAvatar || user?.photoURL || `https://picsum.photos/seed/${user?.uid}/200/200`;

    return (
        <div className="flex flex-col h-full">
            <header className="flex items-center h-16 shrink-0 border-b px-6">
                <div className="flex items-center gap-2">
                    <User className="h-6 w-6" />
                    <h2 className="text-xl font-semibold font-headline">My Profile</h2>
                </div>
            </header>
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>Update your photo and personal details here.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...profileForm}>
                            <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-6">
                                <div className="flex items-center gap-6">
                                    <Avatar className="h-24 w-24">
                                        <AvatarImage src={currentAvatarSrc} />
                                        <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                                    </Avatar>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        className="hidden"
                                        accept="image/*"
                                    />
                                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                                        <Upload className="mr-2" /> Upload Photo
                                    </Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={profileForm.control}
                                        name="fullName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Full Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Your full name" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" type="email" defaultValue={user?.email || ""} disabled />
                                    </div>
                                </div>
                                <Button type="submit" disabled={isUploading}>
                                    {isUploading ? <Loader2 className="animate-spin" /> : <Save className="mr-2" />}
                                    Save Changes
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>AI Avatar Generator</CardTitle>
                        <CardDescription>
                            Create a unique profile picture with AI. Describe what you want, and we'll generate it for you.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-6">
                        <Form {...imagePromptForm}>
                            <form onSubmit={imagePromptForm.handleSubmit(onImagePromptSubmit)} className="space-y-4">
                                <FormField
                                    control={imagePromptForm.control}
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
                                <Button type="submit" disabled={isGenerating} className="w-full">
                                    {isGenerating ? <Loader2 className="animate-spin" /> : <Wand2 />}
                                    Generate Image
                                </Button>
                            </form>
                        </Form>
                        <div className="flex flex-col items-center justify-center bg-muted/50 rounded-lg p-4 aspect-square">
                            {isGenerating && (
                                <div className="flex flex-col w-full h-full items-center justify-center gap-2 text-muted-foreground">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    <p>Generating your image...</p>
                                    <Skeleton className="w-full h-full" />
                                </div>
                            )}
                            {!isGenerating && generatedImageUrl && (
                                <div className="relative w-full h-full">
                                    <Image
                                        src={generatedImageUrl}
                                        alt="Generated avatar"
                                        fill
                                        className="object-contain rounded-md"
                                    />
                                </div>
                            )}
                            {!isGenerating && !generatedImageUrl && (
                                <div className="text-center text-muted-foreground">
                                    <Wand2 className="mx-auto h-12 w-12" />
                                    <p className="mt-2">Your generated image will appear here.</p>
                                    <p className="text-xs mt-1">Click "Save Changes" on your profile to apply it.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
