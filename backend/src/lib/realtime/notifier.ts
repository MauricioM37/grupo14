export interface AggregateEvent {
  projectId: string;
  consultationId: string;
  version: number;
  updatedAt: string;
  counts: Record<string, number>;
  percentages: Record<string, number>;
  participantCount: number;
}

type Listener = (event: AggregateEvent) => void;

class AggregateNotifier {
  private readonly listeners = new Map<string, Set<Listener>>();

  subscribe(projectId: string, listener: Listener): () => void {
    const listeners = this.listeners.get(projectId) ?? new Set<Listener>();
    listeners.add(listener);
    this.listeners.set(projectId, listeners);
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) this.listeners.delete(projectId);
    };
  }

  publish(event: AggregateEvent): void {
    for (const listener of this.listeners.get(event.projectId) ?? []) listener(event);
  }
}

export const aggregateNotifier = new AggregateNotifier();
