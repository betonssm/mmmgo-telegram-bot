require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

const token = process.env.BOT_TOKEN;
const webAppUrl = process.env.WEBAPP_URL;

const bot = new TelegramBot(token, { polling: true });

// 🔎 Проверка, что бот получает любые сообщения
bot.on("message", (msg) => {
  console.log("📨 Пришло сообщение от пользователя:", msg.from);
});

// 🧠 Обработчик команды /start с возможным параметром ?start=...
bot.onText(/\/start(?:\s(.+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const refId = match[1]; // если есть ID от пригласившего

  // Формируем ссылку: с ?ref=... или без
  const urlWithRef = refId
    ? `${webAppUrl}?ref=${refId}`
    : webAppUrl;

  bot.sendMessage(chatId, "👋 Добро пожаловать в МММ GO! 💸\nЖми кнопку ниже, чтобы начать:", {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "▶️ Играть в МММ GO",
            web_app: {
              url: urlWithRef,
            },
          },
        ],
      ],
    },
  });
});