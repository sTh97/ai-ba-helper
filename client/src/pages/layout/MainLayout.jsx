import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

const MainLayout = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-blue-800 text-white py-3 px-6 shadow-md">
        <h1 className="text-xl font-bold">📘 BA Tool</h1>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-100 border-r p-4 space-y-4 text-gray-800">
          <nav className="flex flex-col space-y-2 text-sm">
            <NavLink to="/dashboard" className="hover:text-blue-600 font-medium">🏠 Dashboard</NavLink>
            <NavLink to="/add-project" className="hover:text-blue-600 font-medium">🧩 Add Projects</NavLink>
            <NavLink to="/add-user-story" className="hover:text-blue-600 font-medium">✍️ Add User Stories</NavLink>
            <NavLink to="/user-stories" className="hover:text-blue-600 font-medium">📋 User Stories</NavLink>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 bg-white p-6">
          <Outlet />
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-gray-200 text-center py-2 text-sm text-gray-700">
        Model by Taimoor @ 7/6/2025 | Today Time: {currentTime.toLocaleString()}
      </footer>
    </div>
  );
};

export default MainLayout;
