require("dotenv").config();
const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

const app = express();
app.use(express.json());

const token = process.env.BOT_TOKEN;
const webAppUrl = process.env.WEBAPP_URL;
const port = process.env.PORT || 3000;

const bot = new TelegramBot(token);
bot.setWebHook(`${process.env.BASE_URL}/bot${token}`);

// 🔎 Проверка, что бот подключён
bot.getMe()
  .then((info) => console.log("✅ Бот подключён как:", info.username))
  .catch((err) => console.error("❌ Ошибка getMe:", err));

// 🔄 Принимаем обновления от Telegram
app.post(`/bot${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// 📥 Любое сообщение
bot.on("message", (msg) => {
  console.log("📨 Пришло сообщение от пользователя:", msg.from);
});

// 🧠 Команда /start
bot.onText(/\/start(?:\s(.+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const refId = match[1];

  const urlWithRef = refId
    ? `${webAppUrl}?ref=${refId}`
    : webAppUrl;

  bot.sendMessage(chatId, "👋 Добро пожаловать в МММ GO! 💸\nЖми кнопку ниже, чтобы начать:", {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "▶️ Играть в МММ GO",
            web_app: { url: urlWithRef },
          },
        ],
      ],
    },
  });
});

// 🚀 Запускаем Express
app.listen(port, () => {
  console.log(`🚀 Сервер запущен на порту ${port}`);
});