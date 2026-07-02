import { createBrowserRouter } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./components/Home";
import Courses from "./components/Courses";
import Equipment from "./components/Equipment";
import Jobs from "./components/Jobs";
import Competitions from "./components/Competitions";
import CompetitionDetail from "./components/CompetitionDetail";
import CourseDetail from "./components/CourseDetail";
import JobDetail from "./components/JobDetail";
import EquipmentDetail from "./components/EquipmentDetail";
import Channels from "./components/Channels";
import ChannelDetail from "./components/ChannelDetail";
import News from "./components/News";
import NewsDetail from "./components/NewsDetail";
import Theses from "./components/Theses";
import ThesisDetail from "./components/ThesisDetail";
import Stores from "./components/Stores";
import StoreDetail from "./components/StoreDetail";
import ProductDetail from "./components/ProductDetail";
import Trainers from "./components/Trainers";
import TrainerDetail from "./components/TrainerDetail";
import ProfilePage from "./components/ProfilePage";
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
      { path: "competitions/:id", Component: CompetitionDetail },
      { path: "courses/:id", Component: CourseDetail },
      { path: "jobs/:id", Component: JobDetail },
      { path: "equipment/:id", Component: EquipmentDetail },
      { path: "channels", Component: Channels },
      { path: "channels/:id", Component: ChannelDetail },
      { path: "news", Component: News },
      { path: "news/:id", Component: NewsDetail },
      { path: "theses", Component: Theses },
      { path: "theses/:id", Component: ThesisDetail },
      { path: "stores", Component: Stores },
      { path: "stores/:id", Component: StoreDetail },
      { path: "products/:id", Component: ProductDetail },
      { path: "trainers", Component: Trainers },
      { path: "trainers/:id", Component: TrainerDetail },
      { path: "profile/:id", Component: ProfilePage },
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
