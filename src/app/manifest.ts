import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "АКТИВ — сколько стоят ваши вещи",
    short_name: "АКТИВ",
    description: "Рыночная стоимость, обесценивание и реальная цена владения всем, что у вас есть.",
    lang: "ru",
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
      { name: "Отсканировать предмет", url: "/app/assets/new?method=camera", icons: [{ src: "/brand/icon-192.png", sizes: "192x192" }] },
      { name: "Активы", url: "/app/assets" },
    ],
  };
}
