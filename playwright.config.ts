import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: "http://127.0.0.1:4174/videosFurthurr/",
    browserName: "chromium",
  },
  webServer: {
    command: "npm run dev -- --port 4174 --strictPort",
    url: "http://127.0.0.1:4174/videosFurthurr/",
    reuseExistingServer: false,
    env: {
      VITE_SUPABASE_URL: "https://demo.supabase.co",
      VITE_SUPABASE_PUBLISHABLE_KEY: "public-test-key",
    },
  },
});
