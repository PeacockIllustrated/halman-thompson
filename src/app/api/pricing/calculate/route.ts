import { NextRequest, NextResponse } from "next/server";
import { calculatePrice } from "@/lib/pricing/engine";
import type { PricingRequest } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PricingRequest;

    // Basic validation
    if (
      !body.productType ||
      !body.finishId ||
      !body.width ||
      !body.height ||
      !body.thickness
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (body.width <= 0 || body.height <= 0 || body.thickness <= 0) {
      return NextResponse.json(
        { error: "Dimensions must be positive" },
        { status: 400 }
      );
    }

    const result = calculatePrice(body);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Price calculation failed" },
      { status: 500 }
    );
  }
}
