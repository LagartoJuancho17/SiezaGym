"use client";

import Body from "react-muscle-highlighter";
import { muscleWeightsToBodyParts } from "@/lib/exercises/muscleMap";

export default function ExerciseMuscleMap({ muscleWeights }) {
  const data = muscleWeightsToBodyParts(muscleWeights);
  if (!data.length) return null;

  return (
    <div className="flex items-center justify-center gap-4">
      <Body
        data={data}
        side="front"
        gender="male"
        scale={0.85}
        border="rgba(255,255,255,.14)"
        defaultFill="rgba(255,255,255,.06)"
        defaultStroke="rgba(255,255,255,.14)"
      />
      <Body
        data={data}
        side="back"
        gender="male"
        scale={0.85}
        border="rgba(255,255,255,.14)"
        defaultFill="rgba(255,255,255,.06)"
        defaultStroke="rgba(255,255,255,.14)"
      />
    </div>
  );
}
