"use client";

import dynamic from "next/dynamic";

// three.js is the heaviest thing on the page, so it loads after the words are on screen.
const Scene = dynamic(() => import("@/gl/Scene"), { ssr: false });

export default function SceneLoader() {
  return <Scene />;
}
