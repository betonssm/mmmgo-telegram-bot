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
const bot = new TelegramBot(token);
bot.setWebHook(`${baseUrl}${secretPath}`);

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
  const telegramId = msg.from.id;

  try {
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

    // Сообщение и кнопка запуска игры через Game Platform
    await bot.sendMessage(chatId, "🎮 Добро пожаловать в MMMGO!");
    await bot.sendGame(chatId, "mmmgo_game", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🚀 Играть в MMMGO", callback_game: {} }]
        ]
      }
    });

  } catch (error) {
    console.error("Ошибка в /start:", error);
    await bot.sendMessage(chatId, "⚠️ Произошла ошибка при старте. Попробуйте позже.");
  }
}); // ← Вот здесь ЗАКРЫВАЕТСЯ onText
bot.on("web_app_data", async (msg) => {
  const chatId = msg.chat.id;
  const data = msg.web_app_data.data;

  let title = "";
  let description = "Поддержи игру и получи бонусы";
  let payload = "";
  let label = "";
  let amount = 1000 * 10; // 10.00 RUB

  if (data === "subscribe") {
    title = "Премиум-доступ MMMGO";
    payload = "subscribe";
    label = "Премиум-доступ";
  } else if (data === "topup") {
    title = "Пакет мавродиков";
    payload = "topup";
    label = "50 000 мавродиков";
  } else {
    return; // если пришло что-то неожиданное
  }

  await bot.sendInvoice(
    chatId,
    title,
    description,
    payload,
    process.env.PROVIDER_TOKEN,
    "rub",
    [{ label, amount }],
    {
      photo_url: "https://mmmgo-frontend.onrender.com/assets/mavrodik-clean.png",
      need_name: true,
      need_email: false,
      is_flexible: false,
    }
  );
});
bot.on("message", async (msg) => {
  const payment = msg.successful_payment;
  if (!payment) return;

  const userId = msg.from.id;

  if (payment.payload === "subscribe") {
    // Обнови подписку и фонд
  }

  if (payment.payload === "topup") {
    // Начисли 50 000 мавродиков и обнови фонд
  }

  await bot.sendMessage(msg.chat.id, "✅ Платёж успешно обработан!");
});

// 🔥 ВАЖНО! Запуск сервера:
app.listen(port, () => {
  console.log(`🚀 Сервер запущен на порту ${port}`);
});