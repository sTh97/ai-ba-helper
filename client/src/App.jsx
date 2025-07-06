import { Routes, Route, Navigate } from "react-router-dom";
import UserStoryPage from "./pages/UserStoryPage";
import Dashboard from "./pages/Dashboard";
import AddProject from "./pages/AddProject";
import MainLayout from "./pages/layout/MainLayout";

const App = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/add-project" element={<AddProject />} />
        <Route path="/add-user-story" element={<UserStoryPage />} />
        <Route path="/user-stories" element={<h2 className="p-6">📂 All User Stories (coming soon)</h2>} />
      </Route>
    </Routes>
  );
};

export default App;

