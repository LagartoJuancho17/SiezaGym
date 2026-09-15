import { notFound } from "next/navigation";
import ThemeRoot from "@/components/design2/ThemeRoot";
import Backdrop from "@/components/design2/Backdrop";
import Header from "@/components/design2/Header";
import Headline from "@/components/design2/Headline";
import GoalRail from "@/components/design2/GoalRail";
import SearchAndActivity from "@/components/design2/SearchAndActivity";
import TabBar from "@/components/design2/TabBar";
import { homeReferenceFixture } from "@/evals/fixtures/home-reference";

export const dynamic = "force-dynamic";

const VIEWPORTS = { "320": 694, "390": 844, "430": 932 };
const SCENARIOS = ["default", "empty", "long"];

/** Vista local con los mismos componentes que la Home y datos controlados. */
export default async function DesignPreview({ searchParams }) {
  if (process.env.NODE_ENV !== "development" || process.env.D2_PREVIEW !== "true") notFound();
  const params = await searchParams;
  const scenario = SCENARIOS.includes(params.scenario) ? params.scenario : "default";
  const viewport = Object.hasOwn(VIEWPORTS, params.viewport) ? params.viewport : null;

  if (viewport && params.embedded !== "1") {
    const frameSource = `/design-preview?${new URLSearchParams({ scenario, embedded: "1" })}`;
    return (
      <main style={{ minHeight: "100vh", background: "#bfc7d2", color: "#202423", padding: "24px", fontFamily: "system-ui, sans-serif" }}>
        <nav aria-label="Controles de evaluación" style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
          {Object.keys(VIEWPORTS).map((width) => (
            <a key={width} href={`/design-preview?${new URLSearchParams({ viewport: width, scenario })}`} aria-current={width === viewport ? "page" : undefined} style={{ textDecoration: "underline" }}>
              {width} px
            </a>
          ))}
          {SCENARIOS.map((item) => (
            <a key={item} href={`/design-preview?${new URLSearchParams({ viewport, scenario: item })}`} aria-current={item === scenario ? "page" : undefined} style={{ textDecoration: "underline" }}>
              {{ default: "Referencia", empty: "Sin actividad", long: "Textos largos" }[item]}
            </a>
          ))}
        </nav>
        <iframe
          title={`SiezaGym móvil ${viewport} px: ${scenario}`}
          src={frameSource}
          width={viewport}
          height={VIEWPORTS[viewport]}
          style={{ display: "block", margin: "0 auto", border: 0, background: "#83898f" }}
        />
      </main>
    );
  }

  const fixture = homeReferenceFixture(scenario);

  return (
    <ThemeRoot>
      <Backdrop />
      <div className="d2-home">
        <Header {...fixture.header} />
        <Headline {...fixture.headline} />
        <SearchAndActivity activities={fixture.activities}>
          <GoalRail cards={fixture.cards} />
        </SearchAndActivity>
      </div>
      <TabBar activePath="/" />
    </ThemeRoot>
  );
}
