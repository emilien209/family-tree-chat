import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ImageGenerator from "@/components/image-generator";

export default function ProfilePage() {
    return (
        <div className="flex flex-col h-full">
            <header className="flex items-center h-16 shrink-0 border-b px-6">
                <h2 className="text-xl font-semibold font-headline">My Profile</h2>
            </header>
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>Update your photo and personal details here.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-20 w-20">
                                <AvatarImage src="https://picsum.photos/seed/user1/200/200" />
                                <AvatarFallback>JD</AvatarFallback>
                            </Avatar>
                            <Button>Change Photo</Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input id="name" defaultValue="John Doe" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" defaultValue="john.doe@family.com" disabled />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <ImageGenerator />
            </div>
        </div>
    )
}
