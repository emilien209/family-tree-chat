import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Header from '@/components/layout/header';
import { ArrowRight, MessageSquare, Users, Calendar } from 'lucide-react';

export default function Home() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'family-hero');

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <section className="w-full pt-12 md:pt-24 lg:pt-32">
          <div className="container px-4 md:px-6 space-y-10 xl:space-y-16">
            <div className="grid max-w-[1300px] mx-auto gap-4 px-4 sm:px-6 md:px-10 md:grid-cols-2 md:gap-16">
              <div>
                <h1 className="lg:leading-tighter text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl xl:text-[3.4rem] 2xl:text-[3.75rem] font-headline">
                  Rumenera Connect: Your Family, United.
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl mt-4">
                  A private, secure space for your family to chat, share memories, and organize events. All in one place.
                </p>
                <div className="space-x-4 mt-6">
                  <Button asChild size="lg">
                    <Link href="/register">
                      Get Started <ArrowRight className="ml-2" />
                    </Link>
                  </Button>
                  <Button asChild variant="secondary" size="lg">
                    <Link href="/login">Sign In</Link>
                  </Button>
                </div>
              </div>
              <div className="flex justify-center items-center">
                {heroImage && (
                  <Image
                    src={heroImage.imageUrl}
                    alt={heroImage.description}
                    width={600}
                    height={400}
                    className="rounded-xl object-cover shadow-2xl"
                    data-ai-hint={heroImage.imageHint}
                  />
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">Key Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Everything Your Family Needs</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  From group chats to event planning, we've built the tools to keep your family closer than ever.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 lg:max-w-none mt-12">
              <Card className="h-full">
                <CardContent className="p-6 grid gap-4">
                  <div className="bg-primary text-primary-foreground rounded-md w-12 h-12 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold font-headline">Group & Private Chat</h3>
                  <p className="text-muted-foreground">
                    Seamlessly communicate with the whole family or have one-on-one conversations.
                  </p>
                </CardContent>
              </Card>
              <Card className="h-full">
                <CardContent className="p-6 grid gap-4">
                  <div className="bg-primary text-primary-foreground rounded-md w-12 h-12 flex items-center justify-center">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold font-headline">Secure Family Access</h3>
                  <p className="text-muted-foreground">
                    Join with a unique family code, ensuring your space remains private and secure.
                  </p>
                </CardContent>
              </Card>
              <Card className="h-full">
                <CardContent className="p-6 grid gap-4">
                  <div className="bg-primary text-primary-foreground rounded-md w-12 h-12 flex items-center justify-center">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold font-headline">Events & Reminders</h3>
                  <p className="text-muted-foreground">
                    Organize birthdays, anniversaries, and get-togethers with a shared family calendar.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 Rumenera Connect. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
