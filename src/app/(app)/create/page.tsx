import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusSquare, Upload } from "lucide-react";

export default function CreatePage() {
  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center h-16 shrink-0 border-b px-6">
        <div className="flex items-center gap-2">
          <PlusSquare className="h-6 w-6" />
          <h2 className="text-xl font-semibold font-headline">Create New Post</h2>
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center p-4 md:p-6">
        <Card className="w-full max-w-lg">
            <CardHeader>
                <CardTitle>What would you like to share?</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted rounded-lg p-12 text-center">
                    <Upload className="h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-lg font-semibold">Drag and drop photos or videos here</p>
                    <p className="text-muted-foreground mt-1">or click to browse</p>
                    <button className="mt-6 bg-primary text-primary-foreground px-4 py-2 rounded-md">Select from computer</button>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
