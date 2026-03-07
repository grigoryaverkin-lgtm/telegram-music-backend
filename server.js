const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const cors = require("cors");

const TOKEN = process.env.BOT_TOKEN;
const PORT = process.env.PORT || 3000;

if (!TOKEN) {
  throw new Error("BOT_TOKEN is not set");
}

const app = express();
app.use(cors());

const bot = new TelegramBot(TOKEN, { polling: true });

let tracks = [];

bot.on("channel_post", async (msg) => {
  if (!msg.audio) return;

  const track = {
    id: msg.message_id,
    title: msg.audio.title || msg.audio.file_name || "Unknown title",
    artist: msg.audio.performer || "Unknown artist",
    file_id: msg.audio.file_id,
  };

  const exists = tracks.some((item) => item.id === track.id);

  if (!exists) {
    tracks.push(track);
    console.log("Track added:", track.title);
  }
});

app.get("/", (req, res) => {
  res.send("Music backend is running");
});

app.get("/tracks", async (req, res) => {
  try {
    const result = [];

   for (const track of tracks) {
  const file = await bot.getFile(track.file_id);

  const url = `https://api.telegram.org/file/bot${TOKEN}/${file.file_path}`;

  result.push({
    ...track,
    url
  });
}

    res.json(result);
  } catch (error) {
    console.error("Error in /tracks:", error.message);
    res.status(500).json({ error: "Failed to load tracks" });
  }
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});