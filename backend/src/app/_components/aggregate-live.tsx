"use client";

import { useEffect, useState } from "react";

interface Aggregate { counts: unknown; percentages: unknown; participantCount: number; version: number; updatedAt: string | null; }

export default function AggregateLive({ projectId, initial }: { projectId: string; initial: Aggregate }) {
  const [aggregate, setAggregate] = useState(initial);
  useEffect(() => {
    const events = new EventSource(`/api/projects/${projectId}/events`);
    events.addEventListener("aggregate", (event) => {
      try { setAggregate(JSON.parse((event as MessageEvent<string>).data) as Aggregate); } catch { /* GET remains the authority after reconnect. */ }
    });
    return () => events.close();
  }, [projectId]);
  return <div><h3>Resultados agregados</h3><p>Participantes: {aggregate.participantCount}</p><pre>{JSON.stringify({ counts: aggregate.counts, percentages: aggregate.percentages }, null, 2)}</pre><p className="muted">Actualizado: {aggregate.updatedAt ?? "aún sin opiniones"} · versión {aggregate.version}</p></div>;
}
