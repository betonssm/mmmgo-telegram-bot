require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

const token = process.env.BOT_TOKEN;
const webAppUrl = process.env.WEBAPP_URL;

const bot = new TelegramBot(token, { polling: true });

// 👇 Проверка, что бот получает сообщения
bot.on("message", (msg) => {
  console.log("📨 Пришло сообщение от пользователя:", msg.from);
});

// 👇 Кнопка запуска WebApp
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, "👋 Добро пожаловать в МММ GO! 💸\nЖми кнопку ниже, чтобы начать:", {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "▶️ Играть в МММ GO",
            web_app: {
              url: webAppUrl,
            },
          },
        ],
      ],
    },
  });
});