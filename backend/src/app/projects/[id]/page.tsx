import { notFound } from "next/navigation";

import { getPublicProject } from "@/domain/projects/public";
import { getPrismaClient } from "@/lib/prisma";

import AggregateLive from "@/app/_components/aggregate-live";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    const project = await getPublicProject(getPrismaClient(), (await params).id);
    return <><section><p className="muted">Proyecto publicado</p><h1>{project.title}</h1><p>{project.description}</p><p>{project.categories.map((category) => category.name).join(" · ")}</p><p className="muted">Fuente: {project.sourceDate ?? "fecha no indicada"}</p></section><section><h2>Resumen</h2><p>{project.summary}</p></section>{project.consultation ? <section><h2>Consulta</h2><p>{project.consultation.question}</p><ul>{project.consultation.options.map((option) => <li key={option.key}>{option.key}: {option.label}</li>)}</ul><AggregateLive projectId={project.id} initial={project.consultation.aggregate} /></section> : <section><p>Este proyecto todavía no tiene una consulta abierta.</p></section>}<p className="muted">{project.disclaimer}</p></>;
  } catch { notFound(); }
}
