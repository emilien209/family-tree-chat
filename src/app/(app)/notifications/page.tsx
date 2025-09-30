import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart } from "lucide-react";

const notifications = [
    { type: 'like', user: 'chris_j', time: '2h', postImage: 'https://picsum.photos/seed/post1/40/40' },
    { type: 'comment', user: 'sara_b', time: '4h', comment: 'So cool!', postImage: 'https://picsum.photos/seed/post2/40/40' },
    { type: 'follow', user: 'mike_t', time: '1d' },
    { type: 'like', user: 'sara_b', time: '2d', postImage: 'https://picsum.photos/seed/post3/40/40' },
]

export default function NotificationsPage() {
  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center h-16 shrink-0 border-b px-6">
        <div className="flex items-center gap-2">
          <Heart className="h-6 w-6" />
          <h2 className="text-xl font-semibold font-headline">Notifications</h2>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto">
        <ul className="divide-y">
            {notifications.map((note, i) => (
                <li key={i} className="flex items-center gap-4 p-4 hover:bg-muted/50">
                    <Avatar>
                        <AvatarImage src={`https://picsum.photos/seed/user${i}/40/40`} />
                        <AvatarFallback>{note.user.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <p className="flex-1 text-sm">
                        <span className="font-semibold">{note.user}</span>
                        {note.type === 'like' && ' liked your post.'}
                        {note.type === 'comment' && ` commented: ${note.comment}`}
                        {note.type === 'follow' && ' started following you.'}
                        <span className="text-muted-foreground ml-2">{note.time}</span>
                    </p>
                    {note.postImage && <img src={note.postImage} className="h-10 w-10 object-cover" />}
                </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
