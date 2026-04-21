import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Lessons from "./pages/Lessons";
import Exercises from "./pages/Exercises";
import ProgressPage from "./pages/Progress";
import Reports from "./pages/Reports";
import UsersPage from "./pages/UsersPage";
import StudentsPage from "./pages/StudentsPage";
import ChildrenPage from "./pages/ChildrenPage";
import GroupsPage from "./pages/GroupsPage";
import ParentProgressPage from "./pages/ParentProgressPage";
import StudentExercisesPage from "./pages/StudentExercisesPage";
import NotFound from "./pages/NotFound";
import DictionaryPage from "./pages/DictionaryPage";
import QuizPage from "./pages/QuizPage";
import MiniGamesPage from "./pages/MiniGamesPage";
import ImageGamePage from "./pages/ImageGamePage";
import AccountPage from "./pages/AccountPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/lessons" element={<ProtectedRoute><Lessons /></ProtectedRoute>} />
            <Route path="/exercises" element={<ProtectedRoute><Exercises /></ProtectedRoute>} />
            <Route path="/progress" element={<ProtectedRoute><ProgressPage /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute allowedRoles={["admin", "teacher", "parent"]}><Reports /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute allowedRoles={["admin"]}><UsersPage /></ProtectedRoute>} />
            <Route path="/groups" element={<ProtectedRoute allowedRoles={["admin"]}><GroupsPage /></ProtectedRoute>} />
            <Route path="/students" element={<ProtectedRoute allowedRoles={["teacher"]}><StudentsPage /></ProtectedRoute>} />
            <Route path="/children" element={<ProtectedRoute allowedRoles={["parent"]}><ChildrenPage /></ProtectedRoute>} />
            <Route path="/parent-progress" element={<ProtectedRoute allowedRoles={["parent"]}><ParentProgressPage /></ProtectedRoute>} />
            <Route path="/my-exercises" element={<ProtectedRoute allowedRoles={["student"]}><StudentExercisesPage /></ProtectedRoute>} />
            <Route path="/dictionary" element={<ProtectedRoute> <DictionaryPage /> </ProtectedRoute>} />
            <Route path="/quiz" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
            <Route path="/minigames" element={<ProtectedRoute><MiniGamesPage /></ProtectedRoute>} />
            <Route path="/image-game" element={<ProtectedRoute> <ImageGamePage /> </ProtectedRoute>} />
            <Route path="/account"element={<ProtectedRoute><AccountPage /></ProtectedRoute>}/>            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
