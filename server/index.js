// server/index.js
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

// Load routes
const storyRoutes = require("./routes/story.routes");
app.use("/api/stories", storyRoutes);

const aiRoutes = require("./routes/ai.routes");
app.use("/api/ai", aiRoutes);


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




