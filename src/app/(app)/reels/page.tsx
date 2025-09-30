import { Card } from "@/components/ui/card";
import { Clapperboard } from "lucide-react";

export default function ReelsPage() {
  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center h-16 shrink-0 border-b px-6">
        <div className="flex items-center gap-2">
          <Clapperboard className="h-6 w-6" />
          <h2 className="text-xl font-semibold font-headline">Reels</h2>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p>Reels feature coming soon!</p>
        </div>
      </div>
    </div>
  );
}
