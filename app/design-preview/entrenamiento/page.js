import { notFound } from "next/navigation";
import ThemeRoot from "@/components/design2/ThemeRoot";
import Backdrop from "@/components/design2/Backdrop";
import WorkoutPreview from "./WorkoutPreview";

export const dynamic = "force-dynamic";

/** Solo en desarrollo con D2_PREVIEW=true, igual que /design-preview. */
export default async function WorkoutDesignPreview({ searchParams }) {
  if (process.env.NODE_ENV !== "development" || process.env.D2_PREVIEW !== "true") notFound();
  const params = await searchParams;
  return (
    <ThemeRoot>
      <Backdrop />
      <WorkoutPreview stopwatch={params.cronometro === "1"} />
    </ThemeRoot>
  );
}
