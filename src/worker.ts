/// <reference lib="webworker" />
import { Session } from "./session";
import type { Request, Response } from "./protocol";
const scope = self as unknown as DedicatedWorkerGlobalScope;
let session: Session | undefined,
  test = false,
  last = performance.now(),
  lastSnapshot = last,
  inFlight = false;
function send(message: Response) {
  scope.postMessage(
    message,
    message.snapshot ? [message.snapshot.depths.buffer] : [],
  );
}
scope.onmessage = ({ data: r }: { data: Request }) => {
  try {
    if (r.type === "ack") {
      inFlight = false;
      return;
    }
    if (r.type === "init") {
      session = new Session();
      test = r.test;
      last = performance.now();
      send({
        id: r.id,
        type: "ready",
        terrain: session.terrain,
        snapshot: session.snapshot(),
      });
      return;
    }
    if (!session) throw new Error("Session not initialized");
    if (r.type === "benchmark") {
      if (!test) throw new Error("Benchmark requires frozen test mode");
      send({ id: r.id, type: "result", diagnostics: session.benchmark() });
      return;
    }
    if (r.type === "preview") {
      send({ id: r.id, type: "result", result: session.preview(r.command) });
      return;
    }
    if (r.type === "command") {
      const result = session.command(r.id, r.command);
      if (["reset", "pause", "resume"].includes(r.command.type))
        last = performance.now();
      send({ id: r.id, type: "result", result, snapshot: session.snapshot() });
      return;
    }
    if (r.type === "advance") {
      if (!test) throw new Error("Test advancement disabled");
      session.advance(r.seconds);
      send({
        id: r.id,
        type: "snapshot",
        snapshot: session.snapshot(),
        diagnostics: session.diagnostics(),
      });
      return;
    }
    send({ id: r.id, type: "result", diagnostics: session.diagnostics() });
  } catch (error) {
    send({ id: r.id, type: "error", error: String(error) });
  }
};
setInterval(() => {
  if (!session || test) return;
  const now = performance.now();
  session.tick((now - last) / 1000);
  last = now;
  if (now - lastSnapshot >= 100 && !inFlight) {
    lastSnapshot = now;
    inFlight = true;
    send({ id: 0, type: "snapshot", snapshot: session.snapshot() });
  }
}, 16);
