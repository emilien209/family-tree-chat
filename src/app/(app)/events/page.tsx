import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle, MapPin } from "lucide-react"

const events = [
  {
    date: "July 20, 2024",
    title: "Dad's Birthday BBQ",
    location: "Backyard",
    time: "2:00 PM - 8:00 PM",
  },
  {
    date: "August 5, 2024",
    title: "Family Beach Day",
    location: "Sunnyvale Beach",
    time: "10:00 AM - 5:00 PM",
  },
  {
    date: "August 15, 2024",
    title: "Grandma's Anniversary Dinner",
    location: "The Grand Restaurant",
    time: "7:00 PM",
  }
]

export default function EventsPage() {
  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between h-16 shrink-0 border-b px-6">
        <h2 className="text-xl font-semibold font-headline">Family Events</h2>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Event
        </Button>
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
            {events.map((event, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{event.title}</CardTitle>
                  <CardDescription>{event.date} • {event.time}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="mr-2 h-4 w-4" />
                    <span>{event.location}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
