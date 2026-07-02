import { useAppStore } from "./store/useAppStore";
import { TopAppBar } from "./components/TopAppBar";
import { BottomNavBar } from "./components/BottomNavBar";
import { ChatView } from "./features/chat/ChatView";
import { PlanView } from "./features/plan/PlanView";
import { MapView } from "./features/map/MapView";
import { LibraryView } from "./features/library/LibraryView";

export default function App() {
  const tab = useAppStore((s) => s.tab);

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col bg-surface">
      <TopAppBar />
      <main className="min-h-0 flex-1">
        {tab === "chat" && <ChatView />}
        {tab === "plan" && <PlanView />}
        {tab === "map" && <MapView />}
        {tab === "library" && <LibraryView />}
      </main>
      <BottomNavBar />
    </div>
  );
}
