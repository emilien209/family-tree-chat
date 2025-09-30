"use client";

import { Input } from "@/components/ui/input";
import { Search as SearchIcon } from "lucide-react";

export default function SearchPage() {
  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center h-16 shrink-0 border-b px-6">
        <div className="flex items-center gap-2 w-full max-w-md">
          <SearchIcon className="h-5 w-5 text-muted-foreground" />
          <Input placeholder="Search for people, things, or content..." className="border-none focus-visible:ring-0 text-base" />
        </div>
      </header>
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p>Search results will appear here.</p>
        </div>
      </div>
    </div>
  );
}
