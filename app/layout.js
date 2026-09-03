import { Anton, Archivo, Silkscreen } from "next/font/google";
import "./globals.css";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const archivo = Archivo({
  weight: ["400", "500", "600", "800"],
  subsets: ["latin"],
  variable: "--font-sans",
});

const silkscreen = Silkscreen({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-mono-digit",
});

export const metadata = {
  title: "SiezaGym",
  description: "Webapp de entrenamiento — registrá tus series, mirá tu progreso.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      data-theme="dark"
      className={`${anton.variable} ${archivo.variable} ${silkscreen.variable}`}
    >
      <body className="min-h-screen bg-bg text-text antialiased">
        {children}
      </body>
    </html>
  );
}
