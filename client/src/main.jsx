import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import './index.css'
import App from "./App"; // or your root component

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App /> {/* or <UserStoryPage /> if you are directly rendering it */}
    </BrowserRouter>
  </React.StrictMode>
);

