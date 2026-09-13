import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Ddmer 小站",
    short_name: "Ddmer",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/push-icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/push-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
