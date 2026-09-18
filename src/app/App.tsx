import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { useTheme } from "../lib/useTheme";
import { AppErrorBoundary } from "./components/ErrorBoundary";

function ThemeApplier() {
  useTheme();
  return null;
}

export default function App() {
  return (
    <AppErrorBoundary>
      <ThemeApplier />
      <RouterProvider router={router} />
    </AppErrorBoundary>
  );
}
