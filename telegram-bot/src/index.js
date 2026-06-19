'use strict';
require('dotenv').config();

const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const { formatLaunch, formatStats, formatMigration } = require('./formatter');

const { TELEGRAM_BOT_TOKEN, API_URL = 'http://localhost:3001', POLL_INTERVAL_MS = 30000 } = process.env;
if (!TELEGRAM_BOT_TOKEN) { console.error('Missing TELEGRAM_BOT_TOKEN'); process.exit(1); }

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
const api = axios.create({ baseURL: API_URL, timeout: 10000 });

const subscribers = new Set(process.env.CHAT_ID ? [process.env.CHAT_ID] : []);
let knownIds = new Set();

const send = (chatId, text) => bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
const broadcast = (text) => subscribers.forEach(id => send(id, text));
const get = async (path) => (await api.get(path)).data;
const oops = (chatId, err) => { console.error(err?.message); send(chatId, '⚠️ Failed to fetch data.'); };

// Commands
bot.onText(/\/start/, (msg) =>
  send(msg.chat.id, [
    '👋 *Welcome to WaveMint Bot!*',
    'Track Stellar token launches in real time.\n',
    '📋 *Commands:*',
    '/trending — Top 5 trending launches',
    '/new — 5 newest launches',
    '/launch <id> — Launch details',
    '/stats — Platform statistics',
    '/subscribe — Subscribe to alerts',
    '/unsubscribe — Unsubscribe from alerts',
  ].join('\n'))
);

bot.onText(/\/trending/, async (msg) => {
  try {
    const launches = await get('/launches?sort=trending&limit=5');
    if (!launches.length) return send(msg.chat.id, '📭 No trending launches found.');
    send(msg.chat.id, '🔥 *Trending Launches*\n\n' + launches.map(formatLaunch).join('\n\n'));
  } catch (e) { oops(msg.chat.id, e); }
});

bot.onText(/\/new/, async (msg) => {
  try {
    const launches = await get('/launches?sort=newest&limit=5');
    if (!launches.length) return send(msg.chat.id, '📭 No launches found.');
    send(msg.chat.id, '🆕 *Newest Launches*\n\n' + launches.map(formatLaunch).join('\n\n'));
  } catch (e) { oops(msg.chat.id, e); }
});

bot.onText(/\/launch (.+)/, async (msg, match) => {
  try {
    const launch = await get(`/launches/${match[1].trim()}`);
    send(msg.chat.id, formatLaunch(launch));
  } catch (e) { oops(msg.chat.id, e); }
});

bot.onText(/\/stats/, async (msg) => {
  try {
    const stats = await get('/stats');
    send(msg.chat.id, formatStats(stats));
  } catch (e) { oops(msg.chat.id, e); }
});

bot.onText(/\/subscribe/, (msg) => {
  subscribers.add(String(msg.chat.id));
  send(msg.chat.id, '✅ Subscribed to WaveMint alerts!');
});

bot.onText(/\/unsubscribe/, (msg) => {
  subscribers.delete(String(msg.chat.id));
  send(msg.chat.id, '🔕 Unsubscribed from alerts.');
});

// Background polling
async function poll() {
  try {
    const launches = await get('/launches?sort=newest&limit=20');
    for (const l of launches) {
      const id = String(l.id ?? l.contractId);
      if (!knownIds.has(id)) {
        if (knownIds.size > 0) broadcast(`🆕 *New Launch!*\n\n${formatLaunch(l)}`);
        knownIds.add(id);
      }
      if (l.migrated && !knownIds.has(`m:${id}`)) {
        broadcast(formatMigration(l));
        knownIds.add(`m:${id}`);
      }
    }
  } catch (e) {
    console.error('Poll error:', e?.message);
  }
}

// Seed known IDs on startup, then start polling
get('/launches?sort=newest&limit=100')
  .then(launches => { knownIds = new Set(launches.map(l => String(l.id ?? l.contractId))); })
  .catch(() => {})
  .finally(() => setInterval(poll, Number(POLL_INTERVAL_MS)));

console.log('🤖 WaveMint Telegram bot started.');
