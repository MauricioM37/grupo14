import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Participación Ciudadana Activa", description: "Información y opiniones ciudadanas no vinculantes." };

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="es"><body><header><Link href="/">Participación Ciudadana</Link><nav><Link href="/suscribirse">Suscribirse</Link><Link href="/admin">Administración</Link></nav></header><main>{children}</main><footer>Opiniones ciudadanas voluntarias. No son votos legislativos oficiales.</footer></body></html>;
}
