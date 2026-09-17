import Link from "next/link";
import ThemeRoot from "./ThemeRoot";
import Backdrop from "./Backdrop";
import TabBar from "./TabBar";
import { ArrowLeftIcon } from "./Icons";

/** Shared frame for the remaining authenticated screens. Data stays in each page. */
export default function PageShell({ title, eyebrow, backHref, backLabel = "Volver", action, wide = false, children }) {
  return (
    <ThemeRoot>
      <Backdrop />
      <div className={`d2-page d2-workspace${wide ? " d2-page-wide" : ""}`}>
        <header className="d2-compose-head">
          {backHref && <Link href={backHref} aria-label={backLabel} className="d2-back"><ArrowLeftIcon size={20} width={1.8} /></Link>}
          <div className="d2-page-heading">
            {eyebrow && <p className="d2-page-eyebrow">{eyebrow}</p>}
            <h1 className="d2-page-title">{title}</h1>
          </div>
          {action}
        </header>
        {children}
      </div>
      <TabBar />
    </ThemeRoot>
  );
}
