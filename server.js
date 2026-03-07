const express = require("express")
const TelegramBot = require("node-telegram-bot-api")
const cors = require("cors")

const TOKEN = "8078917420:AAExpGQ6R7SFdnYjaxCdKlt0OopymVXJag4"

const app = express()
app.use(cors())

const bot = new TelegramBot(TOKEN, { polling: true })

let tracks = []

bot.on("channel_post", (msg) => {

  if (msg.audio) {

    const track = {
      id: msg.message_id,
      title: msg.audio.title || msg.audio.file_name,
      artist: msg.audio.performer || "Unknown",
      file_id: msg.audio.file_id
    }

    tracks.push(track)

    console.log("Track added:", track.title)

  }

})

app.get("/tracks", async (req, res) => {

  const result = []

  for (let track of tracks) {

    const file = await bot.getFile(track.file_id)

    const url = `https://api.telegram.org/file/bot${TOKEN}/${file.file_path}`

    result.push({
      ...track,
      url
    })

  }

  res.json(result)

})

app.listen(3000, () => {
  console.log("Server started on port 3000")
})