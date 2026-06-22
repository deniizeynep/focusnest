import cors from "cors";
import "dotenv/config";
import express from "express";

import authRoutes from "./routes/auth.routes";
import sessionRoutes from "./routes/session.routes";
import taskRoutes from "./routes/task.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "Pomodoro API çalışıyor." });
});

app.get("/api", (_req, res) => {
  res.json({
    ok: true,
    message: "FocusNest API çalışıyor",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/sessions", sessionRoutes);

const PORT = process.env.PORT || 5000;

app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`API çalışıyor: http://0.0.0.0:${PORT}`);
});
