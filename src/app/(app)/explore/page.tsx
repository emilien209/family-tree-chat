import { Card } from "@/components/ui/card";
import { Compass } from "lucide-react";
import Image from "next/image";

const images = Array.from({ length: 21 }, (_, i) => `https://picsum.photos/seed/explore${i + 1}/500/500`);

export default function ExplorePage() {
  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center h-16 shrink-0 border-b px-6">
        <div className="flex items-center gap-2">
          <Compass className="h-6 w-6" />
          <h2 className="text-xl font-semibold font-headline">Explore</h2>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto p-2 md:p-4">
        <div className="grid grid-cols-3 gap-1 md:gap-4">
            {images.map((src, index) => (
                 <Card key={index} className="aspect-square overflow-hidden">
                    <Image src={src} alt={`Explore image ${index + 1}`} width={500} height={500} className="w-full h-full object-cover" />
                </Card>
            ))}
        </div>
      </div>
    </div>
  );
}
