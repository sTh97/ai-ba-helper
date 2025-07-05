// server/index.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

import storyRoutes from "./routes/story.routes.mjs";
import aiRoutes from "./routes/ai.routes.mjs";
import projectRoutes from "./routes/projects.routes.mjs";


dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

// Load routes
app.use("/api/stories", storyRoutes);

app.use("/api/ai", aiRoutes);

app.use("/api/projects", projectRoutes);


// MongoDB Connection

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(process.env.PORT || 5000, () =>
      console.log(`Server running on port ${process.env.PORT || 5000}`)
    );
  })
  .catch((err) => console.error("MongoDB connection error:", err));




