import "express-async-errors";
import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cron from "node-cron";
import { pool, initDb } from "./db.js";
import { notifyTelegram, todayIST } from "./notify.js";
import publicRoutes from "./routes/public.js";
import adminRoutes from "./routes/admin.js";

const required = [
  "DB_HOST",
  "DB_USER",
  "DB_PASSWORD",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD",
  "JWT_SECRET",
];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error("Missing environment variables:", missing.join(", "));
  process.exit(1);
}

const app = express();
app.set("trust proxy", 1); // Railway sits behind a proxy; needed for correct client IPs in rate limits
// cross-origin resource policy: car photos load from the Vercel site, which is a different origin than this API
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

const allowed = (process.env.CLIENT_URL || "")
  .split(",")
  .map((s) => s.trim().replace(/\/$/, ""))
  .filter(Boolean);
app.use(
  cors({
    origin(origin, cb) {
      // allow no-origin tools (curl, health checks) and listed sites; localhost only outside production
      if (
        !origin ||
        "https://urvi-tours-and-travels.onrender.com" ||
        allowed.includes(origin) ||
        (process.env.NODE_ENV !== "production" && /localhost/.test(origin))
      ) {
        return cb(null, true);
      }
      cb(new Error("Not allowed by CORS"));
    },
  }),
);
app.get("/health", (_req, res) => res.json({ ok: true }));

// Admin gets a bigger body limit (car photos are uploaded as resized base64); public routes stay at 20kb.
app.use("/api/admin", express.json({ limit: "600kb" }), adminRoutes);
app.use(express.json({ limit: "20kb" }));
app.use("/api", publicRoutes);

// Async errors land here
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

// Every morning at 9:00 IST: send today's follow-ups to Telegram
cron.schedule(
  "0 9 * * *",
  async () => {
    try {
      const [rows] = await pool.query(
        `SELECT name, phone FROM inquiries
          WHERE follow_up_date IS NOT NULL AND follow_up_date <= ? AND status NOT IN ('converted','closed')
          ORDER BY follow_up_date`,
        [todayIST()],
      );
      if (!rows.length) return;
      const lines = rows
        .map((r, i) => `${i + 1}. ${r.name} - ${r.phone}`)
        .join("\n");
      await notifyTelegram(
        `⏰ Follow-ups due today (${rows.length}):\n${lines}`,
      );
    } catch (err) {
      console.error("Follow-up cron failed", err);
    }
  },
  { timezone: "Asia/Kolkata" },
);

const port = Number(process.env.PORT || 4000);
initDb()
  .then(() => app.listen(port, () => console.log(`API listening on ${port}`)))
  .catch((err) => {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  });
