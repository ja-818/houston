export default function () {
  return {
    downloadCode: process.env.DOWNLOAD_CODE || "getsh*tdone",
    posthogKey: process.env.POSTHOG_KEY || "",
    posthogHost: process.env.POSTHOG_HOST || "https://us.i.posthog.com",
  };
}
