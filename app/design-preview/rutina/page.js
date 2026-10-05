import { notFound } from "next/navigation";
import ThemeRoot from "@/components/design2/ThemeRoot";
import Backdrop from "@/components/design2/Backdrop";
import RoutinePreview from "./RoutinePreview";

export const dynamic = "force-dynamic";

/** Solo en desarrollo con D2_PREVIEW=true, igual que /design-preview. */
export default function RoutineDesignPreview() {
  if (process.env.NODE_ENV !== "development" || process.env.D2_PREVIEW !== "true") notFound();
  return (
    <ThemeRoot>
      <Backdrop />
      <RoutinePreview />
    </ThemeRoot>
  );
}
