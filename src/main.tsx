import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles/tokens.css";
import "./styles/global.css";
import "./styles/basic.css";
import "./styles/overlays.css";
import "./styles/tabs.css";
import "./styles/toast.css";
import "./styles/composed.css";
import "./styles/gallery.css";

createRoot(document.getElementById("root")!).render(<App />);
