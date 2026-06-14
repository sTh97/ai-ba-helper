import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

import storyRoutes from "./routes/story.routes.mjs";
import aiRoutes from "./routes/ai.routes.mjs";
import projectRoutes from "./routes/projects.routes.mjs";
import dashboardRoutes from "./routes/dashboard.routes.mjs";
import authRoutes from "./routes/auth.routes.mjs";
import roleRoutes from "./routes/role.routes.mjs";
import userRoutes from "./routes/user.routes.mjs";
import prototypeRoutes from "./routes/prototype.routes.mjs";
import marketingRoutes from "./routes/marketing.routes.mjs";
import solutionRoutes from "./routes/solution.routes.mjs";
import { seedDatabase } from "./seed/seed.mjs";
import { markStaleJobsFailed } from "./services/prototypeJobRunner.mjs";

dotenv.config();
const app = express();
app.use(express.json({ limit: "15mb" }));
app.use(cors());

app.use("/api/auth", authRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/users", userRoutes);
app.use("/api/stories", storyRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/applications", prototypeRoutes);
app.use("/api/marketing", marketingRoutes);
app.use("/api/solutions", solutionRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected");
    await markStaleJobsFailed();
    await seedDatabase();
    app.listen(process.env.PORT || 5000, () =>
      console.log(`Server running on port ${process.env.PORT || 5000}`)
    );
  })
  .catch((err) => console.error("MongoDB connection error:", err));
