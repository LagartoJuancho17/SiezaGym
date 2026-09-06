import Image from "next/image";
import Link from "next/link";
import AccountMenu from "@/components/home/AccountMenu";

function IconSquare({ children, ...props }) {
  const className =
    "flex h-11 w-11 items-center justify-center rounded-[12px] border border-white/30 bg-white/20 text-white backdrop-blur-md transition hover:bg-white/30";
  return props.href ? (
    <Link {...props} className={className}>
      {children}
    </Link>
  ) : (
    <button type="button" {...props} className={`relative ${className}`}>
      {children}
    </button>
  );
}

// Hero fotografico de Rutinas. children se dibuja sobre la foto, debajo del
// titulo: ahi va el selector de mes.
export default function RoutinesHero({
  title,
  accountInitial,
  accountPhotoURL,
  accountEmail,
  children,
}) {
  return (
    <div className="relative flex min-h-[230px] w-full flex-col justify-end overflow-hidden sm:min-h-[260px] lg:min-h-[240px]">
      <div className="absolute inset-0 z-0">
        <Image src="/hero-gym.jpg" alt="" fill priority sizes="100vw" className="object-cover object-center" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(105deg, rgba(20,2,4,0.55) 0%, rgba(20,2,4,0.22) 50%, rgba(20,2,4,0.08) 100%)",
          }}
        />
      </div>

      {/* Desde md el TopNavbar ya trae estos mismos cuatro iconos: si se
          dibujan tambien aca se superponen. */}
      <div className="absolute right-4 top-4 z-20 flex items-center gap-2.5 md:hidden">
        <IconSquare href="/rutinas" aria-label="Dispositivo">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="7" y="4" width="10" height="16" rx="2" />
            <path d="M9 2h6M9 22h6" />
          </svg>
        </IconSquare>

        <IconSquare aria-label="Notificaciones">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-[#FF5733]" />
        </IconSquare>

        <div className="[&_button]:h-11 [&_button]:w-11 [&_button]:rounded-[12px] [&_button]:border-white/30 [&_button]:bg-white/20 [&_button]:text-white [&_button]:backdrop-blur-md">
          <AccountMenu initial={accountInitial} photoURL={accountPhotoURL} email={accountEmail} size="sm" variant="hero" />
        </div>

        <IconSquare href="/perfil" aria-label="Ajustes">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </IconSquare>
      </div>

      <div className="relative z-10 flex flex-col gap-4 px-5 pb-5">
        <h1 className="font-sans text-[40px] font-bold leading-none tracking-tight text-white sm:text-[46px] lg:text-[58px]">
          {title}
        </h1>
        {children}
      </div>
    </div>
  );
}
