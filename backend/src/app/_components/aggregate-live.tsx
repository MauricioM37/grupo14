"use client";

import { useEffect, useState } from "react";

interface Aggregate { counts: unknown; percentages: unknown; participantCount: number; version: number; updatedAt: string | null; }

export default function AggregateLive({ projectId, initial }: { projectId: string; initial: Aggregate }) {
  const [aggregate, setAggregate] = useState(initial);
  useEffect(() => {
    let disposed = false;
    async function refreshPersistedAggregate() {
      try {
        const response = await fetch(`/api/projects/${projectId}`, { cache: "no-store" });
        if (!response.ok) return;
        const project = await response.json() as { consultation?: { aggregate?: Aggregate } | null };
        if (!disposed && project.consultation?.aggregate) setAggregate(project.consultation.aggregate);
      } catch { /* The next reconnect or manual refresh remains authoritative. */ }
    }
    void refreshPersistedAggregate();
    const events = new EventSource(`/api/projects/${projectId}/events`);
    events.addEventListener("aggregate", (event) => {
      try { setAggregate(JSON.parse((event as MessageEvent<string>).data) as Aggregate); } catch { /* GET remains the authority after reconnect. */ }
    });
    events.addEventListener("error", () => { void refreshPersistedAggregate(); });
    return () => { disposed = true; events.close(); };
  }, [projectId]);
  return <div><h3>Resultados agregados</h3><p>Participantes: {aggregate.participantCount}</p><pre>{JSON.stringify({ counts: aggregate.counts, percentages: aggregate.percentages }, null, 2)}</pre><p className="muted">Actualizado: {aggregate.updatedAt ?? "aún sin opiniones"} · versión {aggregate.version}</p></div>;
}
