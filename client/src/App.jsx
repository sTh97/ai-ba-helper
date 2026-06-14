import { Routes, Route, Navigate } from "react-router-dom";
import UserStoryPage from "./pages/UserStoryPage";
import UserStories from "./pages/UserStories";
import Dashboard from "./pages/Dashboard";
import AddProject from "./pages/AddProject";
import MainLayout from "./pages/layout/MainLayout";
import Login from "./pages/Login";
import Roles from "./pages/Roles";
import Users from "./pages/Users";
import CreateApplication from "./pages/CreateApplication";
import MarketingCollateral from "./pages/MarketingCollateral";
import SolutionArchitecture from "./pages/SolutionArchitecture";
import ProtectedRoute from "./components/ProtectedRoute";

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route element={<ProtectedRoute module="dashboard" action="read" />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>
          <Route element={<ProtectedRoute module="projects" action="read" />}>
            <Route path="/add-project" element={<AddProject />} />
          </Route>
          <Route element={<ProtectedRoute module="stories" action="read" />}>
            <Route path="/add-user-story" element={<UserStoryPage />} />
            <Route path="/user-stories" element={<UserStories />} />
          </Route>
          <Route element={<ProtectedRoute module="applications" action="read" />}>
            <Route path="/create-application" element={<CreateApplication />} />
          </Route>
          <Route element={<ProtectedRoute module="marketing" action="read" />}>
            <Route path="/marketing-collateral" element={<MarketingCollateral />} />
          </Route>
          <Route element={<ProtectedRoute module="solution" action="read" />}>
            <Route path="/solution-architecture" element={<SolutionArchitecture />} />
          </Route>
          <Route element={<ProtectedRoute module="roles" action="read" />}>
            <Route path="/roles" element={<Roles />} />
          </Route>
          <Route element={<ProtectedRoute module="users" action="read" />}>
            <Route path="/users" element={<Users />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
};

export default App;
