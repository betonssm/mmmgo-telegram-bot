require("dotenv").config();
const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

const app = express();
app.use(express.json());

const token = process.env.BOT_TOKEN;
const webAppUrl = process.env.WEBAPP_URL;
const baseUrl = process.env.BASE_URL;
const port = process.env.PORT || 3000;
console.log("📏 Длина токена:", token.length);
console.log("🧼 Токен заканчивается на символ:", JSON.stringify(token[token.length - 1]));

const secretPath = "/bot-webhook"; // безопасный путь вместо токена

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

// Обработка любого сообщения
bot.on("message", (msg) => {
  console.log("📨 Пришло сообщение от пользователя:", msg.from);
});

bot.onText(/\/start(?:\s(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const ref = match[1];

  try {
    const telegramId = msg.from.id;

    // Получаем игрока
    const playerResponse = await fetch(`https://mmmgo-backend.onrender.com/player/${telegramId}`);
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

    // Отправляем кнопку WebApp
    await bot.sendMessage(chatId, "🎮 Добро пожаловать в MMMGO!", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🚀 Играть в MMMGO", web_app: { url: ref ? `https://mmmgo-frontend.onrender.com?ref=${ref}` : "https://mmmgo-frontend.onrender.com" }}],
        ],
      },
    });
  } catch (error) {
    console.error("Ошибка в /start:", error);
    await bot.sendMessage(chatId, "⚠️ Произошла ошибка при старте. Попробуйте позже.");
  }
});