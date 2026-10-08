import { createFileRoute } from "@tanstack/react-router";
import { SpaceGame } from "@/components/game/SpaceGame";
export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({ meta: [
    { title: "Starbound — The Orion Drift" },
    { name: "description", content: "Pilot your retro rocket through the Orion Drift. An immersive 3D space arcade with asteroid dodging, boost and collectible gates." },
    { property: "og:title", content: "Starbound — The Orion Drift" },
    { property: "og:description", content: "A small rocket. An infinite universe. Launch into a playable deep-space flight adventure." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: SpaceGame,
});
