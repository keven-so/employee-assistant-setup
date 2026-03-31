"use client";

import { TopBar } from "@/components/dashboard/TopBar";
import { CalendarCard } from "@/components/dashboard/CalendarCard";
import { TasksCard } from "@/components/dashboard/TasksCard";
import { NewsCard } from "@/components/dashboard/NewsCard";
import { ChatPanel } from "@/components/chat/ChatPanel";

export default function Home() {
  return (
    <div className="h-screen flex flex-col text-base">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-[0_0_65%] overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6 auto-rows-fr">
            <CalendarCard />
            <TasksCard />
          </div>
          <NewsCard />
        </main>
        <ChatPanel />
      </div>
    </div>
  );
}
