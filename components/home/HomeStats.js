import MuscleVolumeWidget from "./widgets/MuscleVolumeWidget";
import PushPullWidget from "./widgets/PushPullWidget";
import CompletionWidget from "./widgets/CompletionWidget";
import WeekdayVolumeWidget from "./widgets/WeekdayVolumeWidget";
import IntensityGaugeWidget from "./widgets/IntensityGaugeWidget";
import SessionVolumeTrendWidget from "./widgets/SessionVolumeTrendWidget";
import IntensityZonesWidget from "./widgets/IntensityZonesWidget";
import CaloriesGoalWidget from "./widgets/CaloriesGoalWidget";
import WeekStrip from "./WeekStrip";

// Mismo reparto de columnas que la referencia: card grande a la izquierda,
// dos columnas de widgets chicos al medio, y la de zonas a la derecha.
export default function HomeStats({
  muscleVolume,
  sessionBars,
  balance,
  completion,
  weekdays,
  intensity,
  trend,
  zones,
  sequence,
  calories,
  durationText,
  trainedDates,
  streak,
}) {
  return (
    <section aria-label="Métricas de entrenamiento" className="w-full px-4 pb-4 sm:px-6 lg:px-7">
      <div className="mx-auto grid max-w-[1360px] gap-0.5 lg:grid-cols-12">
        <MuscleVolumeWidget
          rows={muscleVolume.rows}
          totalKg={muscleVolume.totalKg}
          sessionBars={sessionBars}
          className="lg:col-span-4 lg:row-span-2"
        />

        <PushPullWidget balance={balance} className="lg:col-span-3" />
        <CompletionWidget completion={completion} className="lg:col-span-3" />

        <IntensityZonesWidget
          zones={zones}
          sequence={sequence}
          durationText={durationText}
          className="lg:col-span-2 lg:row-span-2"
        />

        <WeekdayVolumeWidget days={weekdays} className="lg:col-span-3" />

        <div className="grid gap-0.5 sm:grid-cols-2 lg:col-span-3 lg:grid-cols-2">
          <IntensityGaugeWidget intensity={intensity} />
          <SessionVolumeTrendWidget trend={trend} />
        </div>

        <CaloriesGoalWidget calories={calories} className="lg:col-span-5" />
        <WeekStrip trainedDates={trainedDates} streak={streak} className="lg:col-span-7" />
      </div>
    </section>
  );
}
