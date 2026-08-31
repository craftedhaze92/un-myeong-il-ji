import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "운명일지",
    short_name: "운명일지",
    description: "정밀 절기 데이터로 보는 사주팔자와 운세 기록",
    start_url: "/",
    display: "standalone",
    background_color: "#0f1014",
    theme_color: "#0f1014",
    lang: "ko",
    icons: [
      {
        src: "/unmyeongilji_img_192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/unmyeongilji_img_512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
