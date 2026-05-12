import https from "https";
import http from "http";

let lastRequestTime = Date.now();

/**
 * Middleware to track activity
 */
export const activityTracker = (req, res, next) => {
  lastRequestTime = Date.now();
  next();
};

/**
 * Starts a keep-alive script that pings the server if no activity is detected
 * @param {string} url - The external URL of the backend
 */
const keepAlive = (url) => {
  if (!url) {
    console.warn("[Keep-Alive] No BACKEND_URL provided. Script disabled.");
    return;
  }

  const protocol = url.startsWith("https") ? https : http;
  const interval = 5 * 60 * 1000; // 5 minutes

  console.log(`[Keep-Alive] Monitoring activity. Will ping ${url} after ${interval / 60000} mins of inactivity.`);

  setInterval(() => {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;

    if (timeSinceLastRequest >= interval) {
      console.log(`[Keep-Alive] Inactivity detected for ${Math.round(timeSinceLastRequest / 60000)} mins. Pinging...`);
      
      protocol.get(url, (res) => {
        console.log(`[Keep-Alive] Self-ping status: ${res.statusCode}`);
      }).on("error", (err) => {
        console.error(`[Keep-Alive] Self-ping failed: ${err.message}`);
      });
    }
  }, interval);
};

export default keepAlive;
