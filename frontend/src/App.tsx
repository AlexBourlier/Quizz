import { Navigate, Route, Routes } from "react-router-dom";
import { ChatPage } from "./pages/ChatPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { useAuthStore } from "./store/auth.store";

export function App() {
  const token = useAuthStore((state) => state.accessToken);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/chat" element={token ? <ChatPage /> : <Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to={token ? "/chat" : "/login"} replace />} />
    </Routes>
  );
}
