import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { MissionControl } from "./components/mission-control";
import { ChatView } from "./components/chat-view";
import { useSync } from "./hooks/use-sync";
import { useAutoConnect } from "./hooks/use-auto-connect";

/** Slide-fade wrapper used on each route so navigation feels native. */
function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.18 }}
      className="h-full"
    >
      {children}
    </motion.div>
  );
}

function AppRoutes() {
  useSync();
  useAutoConnect();
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <PageTransition>
              <MissionControl />
            </PageTransition>
          }
        />
        <Route
          path="/chat/:convoId"
          element={
            <PageTransition>
              <ChatView />
            </PageTransition>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

export function App() {
  return (
    <BrowserRouter>
      {/* Mobile-width container — centers the app on desktop browsers */}
      <div className="mx-auto h-full w-full max-w-[430px] bg-background shadow-lg">
        <AppRoutes />
      </div>
    </BrowserRouter>
  );
}
