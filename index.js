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

// Обработка /start
bot.onText(/\/start(?:\s(.+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const refId = match[1];
  console.log("✅ Получена команда /start");
  console.log("➡️ refId:", refId);
  const urlWithRef = refId
  ? `https://mmmgo-frontend.onrender.com?ref=${refId}`
  : "https://mmmgo-frontend.onrender.com";

  bot.sendMessage(chatId, "👋 Добро пожаловать в МММGO! 💸\nЖми кнопку ниже, чтобы начать:", {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "🎮 Играть в МММGO",
            web_app: { url: urlWithRef },
          },
        ],
      ],
    },
  });
});
// Тестовая проверка, чтобы убедиться, что маршрут существует
app.get("/bot-webhook", (req, res) => {
  res.send("✅ Webhook работает");
});

// Запуск сервера
app.listen(port, () => {
  console.log(`🚀 Сервер запущен на порту ${port}`);
});