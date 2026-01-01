import { createRoot } from "react-dom/client";
import "./lib/i18n"; // Must be imported before App
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
