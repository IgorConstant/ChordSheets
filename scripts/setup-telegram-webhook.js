#!/usr/bin/env node
// Registra o webhook do Telegram apontando para sua URL de produção
// Uso: node scripts/setup-telegram-webhook.js https://seu-dominio.com

const url = process.argv[2];
const token = process.env.TELEGRAM_BOT_TOKEN;

if (!url || !token) {
  console.error("Uso: TELEGRAM_BOT_TOKEN=xxx node scripts/setup-telegram-webhook.js https://seu-dominio.com");
  process.exit(1);
}

const webhookUrl = `${url}/api/telegram`;

fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ url: webhookUrl }),
})
  .then((r) => r.json())
  .then((data) => {
    if (data.ok) {
      console.log(`✅ Webhook registrado: ${webhookUrl}`);
    } else {
      console.error("❌ Erro:", data.description);
    }
  });
