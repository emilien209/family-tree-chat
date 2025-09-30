import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Heart, MessageSquare, PlusCircle } from "lucide-react"

const posts = [
  {
    id: 1,
    author: {
      name: "Alice",
      avatar: "https://picsum.photos/seed/user2/40/40",
    },
    content: "Had a great time at the family BBQ! Thanks for organizing, Dad!",
    likes: 12,
    comments: 3,
    timestamp: "2h ago",
  },
  {
    id: 2,
    author: {
      name: "John Doe",
      avatar: "https://picsum.photos/seed/user1/40/40",
    },
    content: "The pictures from the beach trip are up! Check them out in the gallery.",
    likes: 8,
    comments: 1,
    timestamp: "1d ago",
  },
];


export default function FeedPage() {
  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between h-16 shrink-0 border-b px-6">
        <h2 className="text-xl font-semibold font-headline">Family Feed</h2>
      </header>
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
                <CardTitle>Create a post</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="flex items-start gap-4">
                     <Avatar>
                        <AvatarImage src="https://picsum.photos/seed/user1/40/40" />
                        <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <Textarea placeholder="What's on your mind?" className="min-h-[60px]" />
                </div>
                <div className="flex justify-between items-center">
                    <Button variant="ghost" size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Add Photo/Video</Button>
                    <Button>Post</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {posts.map((post) => (
            <Card key={post.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarImage src={post.author.avatar} />
                        <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold">{post.author.name}</p>
                        <p className="text-xs text-muted-foreground">{post.timestamp}</p>
                    </div>
                </div>
              </CardHeader>
              <CardContent>
                <p>{post.content}</p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <Heart className="h-4 w-4" /> {post.likes} Likes
                </Button>
                 <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" /> {post.comments} Comments
                </Button>
              </CardFooter>
            </Card>
          ))}

        </div>
      </div>
    </div>
  )
}
