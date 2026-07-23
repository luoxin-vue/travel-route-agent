import { useAppStore } from "./store/useAppStore";
import { useThemeEffect } from "./lib/use-theme";
import { TopAppBar } from "./components/TopAppBar";
import { BottomNavBar } from "./components/BottomNavBar";
import { ChatView } from "./features/chat/ChatView";
import { PlanView } from "./features/plan/PlanView";
import { MapView } from "./features/map/MapView";
import { LibraryView } from "./features/library/LibraryView";

export default function App() {
  const tab = useAppStore((s) => s.tab);
  useThemeEffect();

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col bg-surface">
      <TopAppBar />
      <main className="min-h-0 flex-1">
        <div className={tab === "chat" ? "h-full" : "hidden"}>
          <ChatView />
        </div>
        <div className={tab === "plan" ? "h-full" : "hidden"}>
          <PlanView />
        </div>
        {tab === "map" && <MapView />}
        <div className={tab === "library" ? "h-full" : "hidden"}>
          <LibraryView />
        </div>
      </main>
      <BottomNavBar />
    </div>
  );
}
