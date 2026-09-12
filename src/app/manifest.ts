import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Odonto",
    short_name: "Odonto",
    description: "Gestão clínica odontológica.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3f5f4",
    theme_color: "#111a17",
    lang: "pt-BR",
  };
}
