import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

function gerarCodigo(): string {
  const nonce = crypto.randomBytes(3).toString("hex").toUpperCase();
  const secret = process.env.UNLOCK_SECRET ?? "cifra_secret";
  const checksum = crypto
    .createHmac("sha256", secret)
    .update(nonce)
    .digest("hex")
    .slice(0, 4)
    .toUpperCase();
  return `CIFRA-${nonce}-${checksum}`;
}

async function sendMessage(chatId: number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  });
}

export async function POST(req: NextRequest) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return NextResponse.json({ ok: false });

  // Verifica secret do webhook para segurança
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (secret && secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = await req.json();
  const msg = update?.message;
  if (!msg) return NextResponse.json({ ok: true });

  const chatId: number = msg.chat.id;
  const userId: number = msg.from?.id;
  const text: string = msg.text ?? "";

  const adminIds = (process.env.ADMIN_IDS ?? "")
    .split(",")
    .map((id) => parseInt(id.trim()))
    .filter(Boolean);

  const isAdmin = adminIds.length === 0 || adminIds.includes(userId);

  if (text.startsWith("/start")) {
    await sendMessage(
      chatId,
      "🎸 *Bot Cifra — Gerador de Códigos*\n\n" +
        "Use /gerar para criar um código de desbloqueio.\n" +
        "Envie ao usuário após confirmar o PIX."
    );
  } else if (text.startsWith("/gerar")) {
    if (!isAdmin) {
      await sendMessage(chatId, "❌ Você não tem permissão para isso.");
    } else {
      const codigo = gerarCodigo();
      await sendMessage(
        chatId,
        `✅ *Código gerado!*\n\n\`${codigo}\`\n\n_Copie e envie ao usuário pelo WhatsApp._`
      );
    }
  } else if (text.startsWith("/ajuda")) {
    await sendMessage(
      chatId,
      "📋 *Comandos:*\n\n/gerar — Gera um código de desbloqueio\n/ajuda — Mostra esta mensagem"
    );
  }

  return NextResponse.json({ ok: true });
}
