import { handle } from "hono/vercel";
import app from "../src/server/index.js";

// Export the Hono app as a Vercel Edge Function
// The [[...route]] filename creates a catch-all route for /api/*
export const GET = handle(app);
export const POST = handle(app);
