import { NextRequest } from "next/server";
import { readCrmRelationships } from "@/lib/crm/data";
import { validateWebRead } from "@/lib/crm/reader.mjs";
import { denyUnlessAllowed, failed, json, numberParam } from "../response";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";
const MAX_BODY_BYTES = 8 * 1024;
class BodyError extends Error {
  constructor(public statusCode: number) { super("Invalid read request"); }
}
async function readJsonBody(request: NextRequest): Promise<unknown> {
  if (request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() !== "application/json") throw new BodyError(415);
  const declaredLength = request.headers.get("content-length");
  if (declaredLength && /^\d+$/.test(declaredLength) && Number(declaredLength) > MAX_BODY_BYTES) throw new BodyError(413);
  if (!request.body) throw new BodyError(400);
  const stream = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await stream.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) { await stream.cancel().catch(() => {}); throw new BodyError(413); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch (error) {
    if (error instanceof BodyError) throw error;
    throw new BodyError(400);
  } finally { stream.releaseLock(); }
}

export async function GET(request: NextRequest) {
  const denied = await denyUnlessAllowed(); if (denied) return denied;
  const params = request.nextUrl.searchParams;
  // Public infrastructure may log URLs. Private search and filters use POST only.
  if (Array.from(params.keys()).some(key => key !== "limit" && key !== "offset")) return json({ error: "Use the private search request" }, 400);
  try { return json(await readCrmRelationships({ limit: numberParam(params.get("limit"), 12), offset: numberParam(params.get("offset"), 0) })); }
  catch (error) { return failed(error); }
}

export async function POST(request: NextRequest) {
  const denied = await denyUnlessAllowed(); if (denied) return denied;
  if (request.nextUrl.searchParams.size) return json({ error: "Use the private search request" }, 400);
  try {
    const args = await readJsonBody(request);
    validateWebRead("relationships", args);
    return json(await readCrmRelationships(args as Parameters<typeof readCrmRelationships>[0]));
  } catch (error) {
    if (error instanceof BodyError) return json({ error: error.statusCode === 413 ? "Read request too large" : error.statusCode === 415 ? "JSON read request required" : "Invalid read request" }, error.statusCode);
    return failed(error);
  }
}
