"use client";

import { TopBar } from "@/components/dashboard/TopBar";
import { CalendarCard } from "@/components/dashboard/CalendarCard";
import { PipelineCard } from "@/components/dashboard/PipelineCard";
import { TasksCard } from "@/components/dashboard/TasksCard";
import { QuickPills } from "@/components/dashboard/QuickPills";
import { ChatPanel } from "@/components/chat/ChatPanel";

export default function Home() {
  return (
    <div className="flex flex-col h-screen p-4 gap-3.5">
      <TopBar />

      <div className="flex gap-3.5 flex-1 overflow-hidden min-h-0">
        {/* Left: Assistant Panel */}
        <div
          className="flex-shrink-0 flex flex-col gap-3 w-[280px]"
          style={{ animation: "fadeLeft 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.1s both" }}
        >
          <ChatPanel />
        </div>

        {/* Right: Main Dashboard */}
        <div className="flex-1 flex flex-col gap-3 overflow-hidden">
          <QuickPills />

          <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
            <CalendarCard />
            <PipelineCard />
          </div>

          <div className="flex-shrink-0">
            <TasksCard />
          </div>
        </div>
      </div>
    </div>
  );
}
