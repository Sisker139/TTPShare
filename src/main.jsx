// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

// 👇👇👇 THÊM DÒNG NÀY VÀO 👇👇👇
import "./index.css";
import "./App.css";
// 👆👆👆 QUAN TRỌNG NHẤT 👆👆👆

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);