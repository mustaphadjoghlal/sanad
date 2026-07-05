import { lazy, Suspense } from "react";
import type { ComponentType, LazyExoticComponent } from "react";
import { createBrowserRouter } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./components/Home";
import NotFound from "./components/NotFound";

const Courses = lazy(() => import("./components/Courses"));
const Equipment = lazy(() => import("./components/Equipment"));
const Jobs = lazy(() => import("./components/Jobs"));
const Competitions = lazy(() => import("./components/Competitions"));
const CompetitionDetail = lazy(() => import("./components/CompetitionDetail"));
const CourseDetail = lazy(() => import("./components/CourseDetail"));
const JobDetail = lazy(() => import("./components/JobDetail"));
const EquipmentDetail = lazy(() => import("./components/EquipmentDetail"));
const Channels = lazy(() => import("./components/Channels"));
const ChannelDetail = lazy(() => import("./components/ChannelDetail"));
const News = lazy(() => import("./components/News"));
const NewsDetail = lazy(() => import("./components/NewsDetail"));
const Theses = lazy(() => import("./components/Theses"));
const ThesisDetail = lazy(() => import("./components/ThesisDetail"));
const Stores = lazy(() => import("./components/Stores"));
const StoreDetail = lazy(() => import("./components/StoreDetail"));
const ProductDetail = lazy(() => import("./components/ProductDetail"));
const Trainers = lazy(() => import("./components/Trainers"));
const TrainerDetail = lazy(() => import("./components/TrainerDetail"));
const ProfilePage = lazy(() => import("./components/ProfilePage"));
const Professionals = lazy(() => import("./components/Professionals"));
const SearchPage = lazy(() => import("./components/Search"));
const About = lazy(() => import("./components/About"));
const Privacy = lazy(() => import("./components/Privacy"));
const Terms = lazy(() => import("./components/Terms"));
const AdminDashboard = lazy(() => import("./components/admin/AdminDashboard"));
const AdminLogin = lazy(() => import("./components/admin/AdminLogin"));
const Register = lazy(() => import("./components/auth/Register"));
const UserLogin = lazy(() => import("./components/auth/UserLogin"));
const ForgotPassword = lazy(() => import("./components/auth/ForgotPassword"));
const UserDashboard = lazy(() => import("./components/user/UserDashboard"));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0e0e0e" }}>
      <div
        className="w-10 h-10 rounded-full animate-spin"
        style={{ border: "3px solid rgba(0, 98, 51, 0.2)", borderTopColor: "#00a355" }}
      />
    </div>
  );
}

const page = (C: LazyExoticComponent<ComponentType>) => (
  <Suspense fallback={<PageLoader />}>
    <C />
  </Suspense>
);

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "courses", element: page(Courses) },
      { path: "equipment", element: page(Equipment) },
      { path: "jobs", element: page(Jobs) },
      { path: "competitions", element: page(Competitions) },
      { path: "competitions/:id", element: page(CompetitionDetail) },
      { path: "courses/:id", element: page(CourseDetail) },
      { path: "jobs/:id", element: page(JobDetail) },
      { path: "equipment/:id", element: page(EquipmentDetail) },
      { path: "channels", element: page(Channels) },
      { path: "channels/:id", element: page(ChannelDetail) },
      { path: "news", element: page(News) },
      { path: "news/:id", element: page(NewsDetail) },
      { path: "theses", element: page(Theses) },
      { path: "theses/:id", element: page(ThesisDetail) },
      { path: "stores", element: page(Stores) },
      { path: "stores/:id", element: page(StoreDetail) },
      { path: "products/:id", element: page(ProductDetail) },
      { path: "trainers", element: page(Trainers) },
      { path: "trainers/:id", element: page(TrainerDetail) },
      { path: "profile/:id", element: page(ProfilePage) },
      { path: "professionals", element: page(Professionals) },
      { path: "search", element: page(SearchPage) },
      { path: "about", element: page(About) },
      { path: "privacy", element: page(Privacy) },
      { path: "terms", element: page(Terms) },
      { path: "*", Component: NotFound },
    ],
  },
  {
    path: "/sanad-admin",
    element: page(AdminLogin),
  },
  {
    path: "/sanad-admin/dashboard",
    element: page(AdminDashboard),
  },
  {
    path: "/register",
    element: page(Register),
  },
  {
    path: "/login",
    element: page(UserLogin),
  },
  {
    path: "/forgot-password",
    element: page(ForgotPassword),
  },
  {
    path: "/user/dashboard",
    element: page(UserDashboard),
  },
]);
