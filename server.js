require('dotenv').config();

const express = require('express');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    ok: true,
    service: 'telegram-music-backend',
  });
});

app.get('/health/db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS now');
    res.json({
      ok: true,
      dbTime: result.rows[0].now,
    });
  } catch (error) {
    console.error('DB health error:', error);
    res.status(500).json({
      ok: false,
      error: 'Database connection failed',
    });
  }
});

app.get('/tracks', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM tracks
      ORDER BY id DESC
      LIMIT 100
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('GET /tracks error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

function extractTrackData(msg) {
  const audio = msg.audio || null;
  const document = msg.document || null;
  const media = audio || document;

  if (!media) {
    return null;
  }

  const title =
    audio?.title ||
    document?.file_name ||
    'Unknown title';

  const artist =
    audio?.performer ||
    null;

  const duration =
    audio?.duration ||
    null;

  return {
    title,
    artist,
    album: null,
    year: null,
    duration,
    telegram_file_id: media.file_id,
    telegram_chat_id: msg.chat?.id || null,
    telegram_message_id: msg.message_id || null,
    upload_status: 'uploaded',
  };
}

app.post('/telegram/webhook', async (req, res) => {
  try {
    const update = req.body;

    if (!update || !update.channel_post) {
      return res.sendStatus(200);
    }

    const msg = update.channel_post;
    const track = extractTrackData(msg);

    if (!track) {
      return res.sendStatus(200);
    }

    const existing = await pool.query(
      `
      SELECT id
      FROM tracks
      WHERE telegram_chat_id = $1
        AND telegram_message_id = $2
      LIMIT 1
      `,
      [track.telegram_chat_id, track.telegram_message_id]
    );

    if (existing.rows.length === 0) {
      await pool.query(
        `
        INSERT INTO tracks (
          title,
          artist,
          album,
          year,
          duration,
          telegram_file_id,
          telegram_chat_id,
          telegram_message_id,
          upload_status
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        `,
        [
          track.title,
          track.artist,
          track.album,
          track.year,
          track.duration,
          track.telegram_file_id,
          track.telegram_chat_id,
          track.telegram_message_id,
          track.upload_status,
        ]
      );

      console.log('Track saved:', track.title);
    } else {
      console.log('Track already exists:', track.title);
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error);
    return res.sendStatus(500);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});