import Link from "next/link";

import { listPublicProjects } from "@/domain/projects/public";
import { getPrismaClient } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const projects = await listPublicProjects(getPrismaClient());
  return <><section><p className="muted">Participación informada y no vinculante</p><h1>Proyectos abiertos a la ciudadanía</h1><p>Consulta documentos públicos, pregunta por su contenido y comparte una opinión voluntaria.</p></section><section><h2>Proyectos publicados</h2>{projects.length ? <div className="grid">{projects.map((project) => <article key={project.id}><h3><Link href={`/projects/${project.id}`}>{project.title}</Link></h3><p>{project.description}</p><p className="muted">{project.categories.map((category) => category.name).join(" · ")}</p><Link href={`/projects/${project.id}`}>Ver proyecto y resultados</Link></article>)}</div> : <p>No hay proyectos publicados todavía.</p>}</section></>;
}
