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
      <div className="mx-auto grid max-w-[1360px] grid-cols-6 gap-0.5 lg:grid-cols-12">
        <MuscleVolumeWidget
          rows={muscleVolume.rows}
          totalKg={muscleVolume.totalKg}
          sessionBars={sessionBars}
          className="order-1 col-span-6 lg:order-none lg:col-span-4 lg:row-span-2"
        />

        <PushPullWidget balance={balance} className="order-2 col-span-2 lg:order-none lg:col-span-3" />
        <CompletionWidget completion={completion} className="order-3 col-span-2 lg:order-none lg:col-span-3" />

        <IntensityZonesWidget
          zones={zones}
          sequence={sequence}
          durationText={durationText}
          className="order-6 col-span-6 lg:order-none lg:col-span-2 lg:row-span-2"
        />

        <WeekdayVolumeWidget days={weekdays} className="order-4 col-span-2 lg:order-none lg:col-span-3" />

        <div className="order-5 col-span-6 grid grid-cols-2 gap-0.5 lg:order-none lg:col-span-3">
          <IntensityGaugeWidget intensity={intensity} />
          <SessionVolumeTrendWidget trend={trend} />
        </div>

        <CaloriesGoalWidget calories={calories} className="order-7 col-span-6 lg:order-none lg:col-span-5" />
        <WeekStrip
          trainedDates={trainedDates}
          streak={streak}
          className="order-first col-span-6 lg:order-none lg:col-span-7"
        />
      </div>
    </section>
  );
}
