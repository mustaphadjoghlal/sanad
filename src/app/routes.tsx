import { lazy, Suspense } from "react";
import type { ComponentType, LazyExoticComponent } from "react";
import { createBrowserRouter } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./components/Home";
import NotFound from "./components/NotFound";
import { RouteErrorBoundary } from "./components/ErrorBoundary";

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
const Works = lazy(() => import("./components/Works"));
const WorkDetail = lazy(() => import("./components/WorkDetail"));
const SearchPage = lazy(() => import("./components/Search"));
const About = lazy(() => import("./components/About"));
const Privacy = lazy(() => import("./components/Privacy"));
const Terms = lazy(() => import("./components/Terms"));
const PreviewMember = lazy(() => import("./components/admin/PreviewMember"));
const AdminDashboard = lazy(() => import("./components/admin/AdminDashboard"));
const AdminLogin = lazy(() => import("./components/admin/AdminLogin"));
const Register = lazy(() => import("./components/auth/Register"));
const UserLogin = lazy(() => import("./components/auth/UserLogin"));
const ForgotPassword = lazy(() => import("./components/auth/ForgotPassword"));
const AuthAction = lazy(() => import("./components/auth/AuthAction"));
const UserDashboard = lazy(() => import("./components/user/UserDashboard"));

/**
 * Shown while a page's code downloads. It used to be a spinner filling the
 * whole screen, which reads as "the site hung"; the header stays in place
 * (it lives in Layout) and this hints at the content about to appear.
 */
function PageLoader() {
  return (
    <div className="min-h-screen" style={{ background: "#0e0e0e" }} aria-busy="true" aria-label="جاري التحميل">
      <div className="container mx-auto px-4 py-10 animate-pulse">
        <div style={{ height: "28px", width: "40%", background: "var(--p-10, rgba(0,98,51,0.1))", borderRadius: "6px", marginBottom: "2rem" }} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl" style={{ height: "220px", background: "linear-gradient(145deg,#141414,#101010)", border: "1px solid var(--p-15, rgba(0,98,51,0.15))" }} />
          ))}
        </div>
      </div>
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
    // Without this a thrown error anywhere below renders React Router's own
    // English crash screen instead of the site.
    errorElement: <RouteErrorBoundary />,
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
      { path: "works", element: page(Works) },
      { path: "works/:id", element: page(WorkDetail) },
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
    errorElement: <RouteErrorBoundary />,
    element: page(AdminLogin),
  },
  {
    path: "/sanad-admin/dashboard",
    errorElement: <RouteErrorBoundary />,
    element: page(AdminDashboard),
  },
  {
    path: "/register",
    errorElement: <RouteErrorBoundary />,
    element: page(Register),
  },
  {
    path: "/login",
    errorElement: <RouteErrorBoundary />,
    element: page(UserLogin),
  },
  {
    path: "/forgot-password",
    errorElement: <RouteErrorBoundary />,
    element: page(ForgotPassword),
  },
  {
    // Where Firebase's account emails land once the action URL is pointed
    // here, instead of the unbranded English page on firebaseapp.com.
    path: "/auth/action",
    errorElement: <RouteErrorBoundary />,
    element: page(AuthAction),
  },
  {
    // The member dashboard as each kind of member sees it, from a stand-in
    // profile. Admin only.
    path: "/sanad-admin/preview/:kind",
    errorElement: <RouteErrorBoundary />,
    element: page(PreviewMember),
  },
  {
    path: "/user/dashboard",
    errorElement: <RouteErrorBoundary />,
    element: page(UserDashboard),
  },
]);
