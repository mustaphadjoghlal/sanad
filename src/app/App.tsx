import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { useTheme } from "../lib/useTheme";

function ThemeApplier() {
  useTheme();
  return null;
}

export default function App() {
  return (
    <>
      <ThemeApplier />
      <RouterProvider router={router} />
    </>
  );
}
