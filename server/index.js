import "./config/loadEnv.js";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import { connectDB } from "./config/db.js";
import { errorHandler } from "./middleware/errorHandler.js";

import authRoutes from "./routes/authRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Default 5050: macOS often uses 5000 for AirPlay Receiver (HTTP → 403, not Express).
const PORT = Number(process.env.PORT) || 5050;

/** Set true after Mongo connects — health still works before then (helps cloud health checks). */
let mongoReady = false;

// Dev: reflect any local origin (localhost vs 127.0.0.1). Prod: lock to CLIENT_URL.
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.CLIENT_URL || true
        : true,
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.json({ ok: true, service: "beancraft-api" });
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, mongo: mongoReady });
});

/** Alias if something blocks `/api/*` in a proxy (try this URL when debugging 404s). */
app.get("/health", (_req, res) => {
  res.json({ ok: true, mongo: mongoReady });
});

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/orders", orderRoutes);

// Production: serve Vite build from sibling `client/dist`
if (process.env.NODE_ENV === "production") {
  const dist = path.join(__dirname, "../client/dist");
  app.use(express.static(dist));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(dist, "index.html"));
  });
}

app.use(errorHandler);

async function start() {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });

  try {
    await connectDB();
    mongoReady = true;
  } catch (err) {
    console.error("MongoDB connection failed — fix MONGO_URI on your host:", err.message);
    // Keep process alive so /api/health still returns (mongo: false) for debugging.
  }
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
