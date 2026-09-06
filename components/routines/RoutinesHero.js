import Image from "next/image";
import Link from "next/link";
import AccountMenu from "@/components/home/AccountMenu";

// Mismo hero fotografico de la Home, con el titulo de la pantalla.
export default function RoutinesHero({ title, accountInitial, accountPhotoURL, accountEmail }) {
  return (
    <div className="relative flex min-h-[190px] w-full flex-col justify-between overflow-hidden sm:min-h-[230px]">
      <div className="absolute inset-0 z-0">
        <Image src="/hero-gym.jpg" alt="" fill priority sizes="100vw" className="object-cover object-center" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(100deg, rgba(20,2,4,0.62) 0%, rgba(20,2,4,0.3) 45%, rgba(20,2,4,0.1) 80%, rgba(20,2,4,0.4) 100%)",
          }}
        />
      </div>

      <div className="relative z-20 flex items-center justify-end p-4">
        <div className="flex items-center gap-1 rounded-2xl border border-white/20 bg-black/35 p-1 backdrop-blur-xl">
          <Link href="/rutinas" aria-label="Dispositivo" className="flex h-9 w-9 items-center justify-center rounded-xl text-white/85">
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="7" y="4" width="10" height="16" rx="2" />
              <path d="M9 2h6M9 22h6" />
            </svg>
          </Link>
          <button type="button" aria-label="Notificaciones" className="relative flex h-9 w-9 items-center justify-center rounded-xl text-white/85">
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#FF5733]" />
          </button>
          <div className="[&_button]:h-9 [&_button]:w-9 [&_button]:border-transparent [&_button]:bg-white/15 [&_button]:text-white">
            <AccountMenu initial={accountInitial} photoURL={accountPhotoURL} email={accountEmail} size="sm" variant="hero" />
          </div>
          <Link href="/perfil" aria-label="Ajustes" className="flex h-9 w-9 items-center justify-center rounded-xl text-white/85">
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </Link>
        </div>
      </div>

      <h1 className="relative z-10 px-5 pb-5 font-sans text-[38px] font-bold leading-none tracking-tight text-white sm:text-[46px]">
        {title}
      </h1>
    </div>
  );
}
