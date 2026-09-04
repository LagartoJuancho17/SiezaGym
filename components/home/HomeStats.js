"use client";

function ArrowUpRight() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="15"
      height="15"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[#8C827A] transition hover:text-[#141414]"
    >
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  );
}

export default function HomeStats({ volumeKg = 2040, setsCount = 17, targetSets = 26 }) {
  return (
    <section aria-label="Métricas de entrenamiento" className="w-full px-4 pb-4 sm:px-6 lg:px-7">
      <div className="mx-auto grid max-w-[1360px] gap-3.5 lg:grid-cols-12">
        {/* Session Volume */}
        <div className="flex flex-col justify-between rounded-2xl border border-[#5A1215] bg-[#EDE8E1] p-5 shadow-sm lg:col-span-7">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6E665E]">Volumen de la sesión</span>
              <ArrowUpRight />
            </div>

            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-sans text-4xl font-black tracking-tight text-[#141414]">
                {volumeKg}
              </span>
              <span className="text-xs font-bold text-[#6E665E]">KG</span>
            </div>
          </div>

          <div className="mt-6 border-t border-[#D9D3CA] pt-3.5">
            <div className="text-[11px] font-medium text-[#756C65]">
              Volumen · {setsCount}/{targetSets} series
            </div>
            <div className="mt-2.5 flex h-14 items-end gap-1">
              {[35, 55, 45, 80, 40, 85, 70, 80, 95, 60, 68, 92, 75, 82, 58, 40, 70, 28, 20, 15, 10].map(
                (h, i) => (
                  <div
                    key={i}
                    className={`w-full rounded-t-xs transition-all ${
                      i < 13 ? "bg-[#FF5733]" : "bg-[#CDC6BC]"
                    }`}
                    style={{ height: `${h}%` }}
                  />
                ),
              )}
            </div>
          </div>
        </div>

        {/* HRV Status */}
        <div className="flex flex-col justify-between rounded-2xl border border-[#5A1215] bg-[#EDE8E1] p-5 shadow-sm lg:col-span-5">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6E665E]">Variabilidad (HRV)</span>
              <ArrowUpRight />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <div className="flex items-baseline gap-1">
                <span className="font-sans text-3xl font-black text-[#141414]">42</span>
                <span className="text-xs font-bold text-[#6E665E]">ms</span>
              </div>
              <span className="text-[11px] text-[#8C827A]">Esta semana</span>
            </div>
          </div>
          <div className="mt-2 h-14 w-full">
            <svg viewBox="0 0 150 40" className="h-full w-full overflow-visible">
              <polyline
                points="10,30 40,15 70,35 100,20 135,10"
                fill="none"
                stroke="#FF5733"
                strokeWidth="2"
                strokeDasharray="2,2"
              />
              <circle cx="10" cy="30" r="3" fill="#FF5733" />
              <circle cx="40" cy="15" r="3" fill="#FF5733" />
              <circle cx="70" cy="35" r="3" fill="#FF5733" />
              <circle cx="100" cy="20" r="3" fill="#FF5733" />
              <circle cx="135" cy="10" r="3" fill="#FF5733" />
            </svg>
            <div className="flex justify-between px-1 text-[10px] text-[#8C827A]">
              <span>LUN</span>
              <span>MAR</span>
              <span>MIÉ</span>
              <span>JUE</span>
              <span>VIE</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
