import { getPrismaClient } from "@/lib/prisma";
import { getPublicProject } from "@/domain/projects/public";
import { aggregateNotifier } from "@/lib/realtime/notifier";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const projectId = (await params).id;
  await getPublicProject(getPrismaClient(), projectId);
  const encoder = new TextEncoder();
  let close: (() => void) | undefined;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(`event: ready\ndata: ${JSON.stringify({ projectId })}\n\n`));
      close = aggregateNotifier.subscribe(projectId, (event) => {
        controller.enqueue(encoder.encode(`event: aggregate\ndata: ${JSON.stringify(event)}\n\n`));
      });
    },
    cancel() { close?.(); },
  });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" } });
}
