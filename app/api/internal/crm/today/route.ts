import { NextRequest } from "next/server";
import { readCrmToday } from "@/lib/crm/data";
import { denyUnlessAllowed, failed, json, numberParam } from "../response";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  const denied = await denyUnlessAllowed(); if (denied) return denied;
  try { return json(await readCrmToday({ limit: numberParam(request.nextUrl.searchParams.get("limit"), 8), offset: numberParam(request.nextUrl.searchParams.get("offset"), 0) })); } catch (error) { return failed(error); }
}
