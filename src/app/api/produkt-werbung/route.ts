import { NextResponse } from "next/server";

/** @deprecated Use POST /api/product-ad/generate */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "This endpoint is deprecated. Use POST /api/product-ad/generate instead.",
      redirect: "/api/product-ad/generate",
    },
    { status: 410 }
  );
}
