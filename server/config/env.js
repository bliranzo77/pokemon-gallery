import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

// Load server/.env no matter which directory the process starts in.
dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)), quiet: true });
