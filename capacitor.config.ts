import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.efficiencystrengthtraining.barmath",
  appName: "BAR MATH",
  webDir: ".vercel/output/static",
  server: {
    url: "https://bar-math.vercel.app",
    cleartext: false,
  },
  ios: {
    contentInset: "always",
    preferredContentMode: "mobile",
  },
};

export default config;
