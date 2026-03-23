import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Always load server/.env, even when Node is started from the repo root (e.g. `npm run seed`).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env");

dotenv.config({ path: envPath });
