import { NextResponse, type NextRequest } from "next/server";
import { getProductBySlug } from "@/data/products";
import { getBilbildinMode } from "@/lib/bilbildin/config";
import { getCommerceExperience } from "@/lib/commerce/experience";
import { waitlistSchema } from "@/lib/validation";

const MAX_BODY_BYTES = 5_000;

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === request.nextUrl.host;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const experience = getCommerceExperience(getBilbildinMode(process.env));
  if (!sameOrigin(request)) {
    return NextResponse.json({ message: "Origen no permitido." }, { status: 403 });
  }

  const contentType = request.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    return NextResponse.json(
      { message: "Formato de solicitud no válido." },
      { status: 415 },
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ message: "Solicitud demasiado grande." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Solicitud no válida." }, { status: 400 });
  }

  const parsed = waitlistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Revisá los datos." },
      { status: 400 },
    );
  }

  if (
    parsed.data.productSlug &&
    !getProductBySlug(parsed.data.productSlug)
  ) {
    return NextResponse.json({ message: "Producto no válido." }, { status: 400 });
  }

  return NextResponse.json(
    {
      mode: "preview",
      message: experience.waitlistResponse,
    },
    { status: 202 },
  );
}
