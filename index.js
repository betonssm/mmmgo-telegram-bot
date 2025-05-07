require("dotenv").config();
const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args))

const app = express();
app.use(express.json());

const token = process.env.BOT_TOKEN;
const webAppUrl = process.env.WEBAPP_URL;
const baseUrl = process.env.BASE_URL;
const port = process.env.PORT || 3000;

console.log("📏 Длина токена:", token.length);
console.log("🧼 Токен заканчивается на символ:", JSON.stringify(token[token.length - 1]));

const secretPath = "/bot-webhook";

// Инициализация бота без polling
const bot = new TelegramBot(token, { polling: false });
bot.setWebHook(`${baseUrl}${secretPath}`);
fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`)
  .then(res => res.json())
  .then(info => {
    console.log("🔗 Webhook подключён к:", info.result?.url || "не установлено");
    console.log("🛑 Последняя ошибка:", info.result?.last_error_message || "нет");
  });

// Проверка подключения
bot.getMe()
  .then((info) => console.log("✅ Бот подключён как:", info.username))
  .catch((err) => console.error("❌ Ошибка getMe:", err));

// Webhook-обработчик
app.post(secretPath, (req, res) => {
  console.log("📥 Получен webhook от Telegram:", JSON.stringify(req.body, null, 2));
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Обработка /start
bot.onText(/\/start(?:\s(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const ref = match[1];

  try {
    const telegramId = msg.from.id;

    const playerResponse = await fetch(
      `https://mmmgo-backend.onrender.com/player/${telegramId}${ref ? `?ref=${ref}` : ""}`
    );
    const player = await playerResponse.json();

    if (!player.refSource && ref && ref !== telegramId.toString()) {
      await fetch("https://mmmgo-backend.onrender.com/player/set-ref", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId, refSource: ref }),
      });
      console.log(`✅ Реферал ${ref} установлен для ${telegramId}`);
    } else {
      console.log(`ℹ️ Реферал НЕ установлен для ${telegramId} (уже есть или нет ref)`);
    }

    

    await bot.sendMessage(chatId, `🎮 Добро пожаловать в MMMGO!`, {
      reply_markup: {
        inline_keyboard: [
          [{
            text: "🚀 Играть в MMMGO",
            web_app: { url: `https://mmmgo-frontend.onrender.com?ref=${telegramId}` }
          }],
        ],
      },
    });
  } catch (error) {
    console.error("Ошибка в /start:", error);
    await bot.sendMessage(chatId, "⚠️ Произошла ошибка при старте. Попробуйте позже.");
  }
});
bot.on("message", async (msg) => {
    console.log("📨 Сообщение в бота:", JSON.stringify(msg, null, 2));
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;
  const userName = msg.from.first_name;

  // 💳 Подписка
  if (msg.web_app_data?.data === "subscribe") {
    await bot.sendInvoice(chatId, {
      title: "Подписка MMMGO",
      description: "50 000 мавродиков и доступ к SR рейтингу",
      payload: "mmmgo_premium",
      provider_token: process.env.PROVIDER_TOKEN, // добавь в .env
      currency: "USD",
      prices: [{ label: "Подписка", amount: 1000 }],
      start_parameter: "mmmgo-premium",
    });
  }

  // 💰 Пополнение баланса
  if (msg.web_app_data?.data === "topup") {
    await bot.sendInvoice(chatId, {
      title: "Пополнение счёта MMMGO",
      description: "50 000 мавродиков на баланс",
      payload: "mmmgo_topup",
      provider_token: process.env.PROVIDER_TOKEN,
      currency: "USD",
      prices: [{ label: "Баланс", amount: 1000 }],
      start_parameter: "mmmgo-topup",
    });
  }

  // ✅ Обработка успешного платежа
  if (msg.successful_payment) {
    const payload = msg.successful_payment.invoice_payload;
    const now = new Date();

    if (payload === "mmmgo_premium") {
      await fetch("https://mmmgo-backend.onrender.com/player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramId,
          playerName: userName,
          isInvestor: true,
          premiumSince: now.toISOString(),
          premiumExpires: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 дней
        }),
      });
      await bot.sendMessage(chatId, "🎉 Подписка активирована! SR будет начисляться с 1-го числа месяца.");
    }

    if (payload === "mmmgo_topup") {
      await fetch("https://mmmgo-backend.onrender.com/player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramId,
          playerName: userName,
          balanceBonus: 50000,
        }),
      });
      await bot.sendMessage(chatId, "💸 Баланс пополнен на 50 000 мавродиков!");
    }
  }
});
bot.on("pre_checkout_query", (query) => {
  bot.answerPreCheckoutQuery(query.id, true);
});

// 🔥 ВАЖНО! Запуск сервера:
app.listen(port, () => {
  console.log(`🚀 Сервер запущен на порту ${port}`);
});