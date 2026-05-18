import { createBrowserRouter } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./components/Home";
import Courses from "./components/Courses";
import Equipment from "./components/Equipment";
import Jobs from "./components/Jobs";
import Competitions from "./components/Competitions";
import VoiceRequests from "./components/VoiceRequests";
import Channels from "./components/Channels";
import AdminDashboard from "./components/admin/AdminDashboard";
import AdminLogin from "./components/admin/AdminLogin";
import Register from "./components/auth/Register";
import UserLogin from "./components/auth/UserLogin";
import UserDashboard from "./components/user/UserDashboard";
import NotFound from "./components/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "courses", Component: Courses },
      { path: "equipment", Component: Equipment },
      { path: "jobs", Component: Jobs },
      { path: "competitions", Component: Competitions },
      { path: "voice-requests", Component: VoiceRequests },
      { path: "channels", Component: Channels },
      { path: "*", Component: NotFound },
    ],
  },
  {
    path: "/sanad-admin",
    Component: AdminLogin,
  },
  {
    path: "/sanad-admin/dashboard",
    Component: AdminDashboard,
  },
  {
    path: "/register",
    Component: Register,
  },
  {
    path: "/login",
    Component: UserLogin,
  },
  {
    path: "/user/dashboard",
    Component: UserDashboard,
  },
]);
