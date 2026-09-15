import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "АКТИВ — Personal Asset OS",
    short_name: "АКТИВ",
    description: "Know what your stuff is really worth. Track market value, depreciation and the true cost of everything you own.",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F9F9F9",
    theme_color: "#F9F9F9",
    categories: ["finance", "productivity", "utilities"],
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/brand/icon-192-maskable.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/brand/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Scan an item", url: "/app/assets/new?method=camera", icons: [{ src: "/brand/icon-192.png", sizes: "192x192" }] },
      { name: "Assets", url: "/app/assets" },
    ],
  };
}
