import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Image from "next/image";

const messages = [
    { id: 1, user: { name: 'Alice', avatar: 'https://picsum.photos/seed/user2/40/40' }, text: 'Hey everyone! How is it going?', time: '10:30 AM', isCurrentUser: false },
    { id: 2, user: { name: 'You', avatar: 'https://picsum.photos/seed/user1/40/40' }, text: 'Going great! Just finished up some work. What about you?', time: '10:31 AM', isCurrentUser: true },
    { id: 3, user: { name: 'Bob', avatar: 'https://picsum.photos/seed/user3/40/40' }, text: 'I\'m planning a BBQ for this weekend. Who\'s in?', time: '10:32 AM', isCurrentUser: false },
    { id: 4, user: { name: 'You', avatar: 'https://picsum.photos/seed/user1/40/40' }, text: 'Sounds amazing! I am definitely in. What should I bring?', time: '10:33 AM', isCurrentUser: true },
    { id: 5, user: { name: 'Charlie', avatar: 'https://picsum.photos/seed/user4/40/40' }, text: 'I can bring some dessert. I found a great cake recipe.', time: '10:35 AM', isCurrentUser: false },
    { id: 6, user: { name: 'Alice', avatar: 'https://picsum.photos/seed/user2/40/40' }, image: 'https://picsum.photos/seed/bbq/400/300', text: 'Speaking of which, look at this grill!', time: '10:40 AM', isCurrentUser: false },
];

export default function MessageList() {
    return (
        <div className="space-y-6">
            {messages.map((message, index) => (
                <div key={index} className={`flex items-start gap-4 ${message.isCurrentUser ? 'justify-end' : ''}`}>
                    {!message.isCurrentUser && (
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={message.user.avatar} alt={message.user.name} />
                            <AvatarFallback>{message.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                    )}
                    <div className={`flex flex-col gap-1 ${message.isCurrentUser ? 'items-end' : 'items-start'}`}>
                        <div className={`rounded-lg p-3 max-w-xs md:max-w-md lg:max-w-lg ${message.isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            {!message.isCurrentUser && <p className="font-semibold text-sm mb-1">{message.user.name}</p>}
                            {message.image && (
                                <Image
                                    src={message.image}
                                    alt="Shared media"
                                    width={400}
                                    height={300}
                                    className="rounded-md mb-2 object-cover"
                                    data-ai-hint="barbecue grill"
                                />
                            )}
                            <p className="text-sm">{message.text}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{message.time}</span>
                    </div>
                    {message.isCurrentUser && (
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={message.user.avatar} alt={message.user.name} />
                            <AvatarFallback>Y</AvatarFallback>
                        </Avatar>
                    )}
                </div>
            ))}
        </div>
    );
}
