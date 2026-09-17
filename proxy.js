import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/firebase/constants";

export function proxy(request) {
  // Atajo local para revisar la referencia desde la URL raíz. Solo existe con
  // la bandera explícita de evaluación y nunca cambia la Home autenticada en
  // producción.
  if (
    process.env.NODE_ENV === "development"
    && process.env.D2_PREVIEW === "true"
    && request.nextUrl.pathname === "/"
  ) {
    return NextResponse.rewrite(new URL("/design-preview?viewport=390", request.url));
  }

  const session = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const loginUrl = new URL("/login", request.url);

  if (!session) {
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*"],
};
