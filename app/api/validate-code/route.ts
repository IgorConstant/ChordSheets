import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

function validateHmacCode(code: string): boolean {
  const secret = process.env.UNLOCK_SECRET;
  if (!secret) return false;

  // Format: CIFRA-{NONCE}-{CHECKSUM}
  const parts = code.toUpperCase().split("-");
  if (parts.length !== 3 || parts[0] !== "CIFRA") return false;

  const [, nonce, checksum] = parts;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(nonce)
    .digest("hex")
    .slice(0, 4)
    .toUpperCase();

  return checksum === expected;
}

export async function POST(req: NextRequest) {
  const { code } = await req.json();

  if (!code) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  const normalized = code.trim().toUpperCase();

  // 1. Check HMAC-signed codes (from Telegram bot)
  if (validateHmacCode(normalized)) {
    return NextResponse.json({ valid: true });
  }

  // 2. Fall back to static codes list
  const validCodes = (process.env.UNLOCK_CODES ?? "")
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);

  const isValid = validCodes.includes(normalized);
  return NextResponse.json({ valid: isValid });
}
