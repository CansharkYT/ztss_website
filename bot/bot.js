const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const TOKEN = process.env.DISCORD_TOKEN;
const ANNOUNCEMENT_CHANNEL_ID = '1394688364334153788';
const ROLE_ID_TO_REMOVE = '1394655675958952026';
const FILE_PATH = 'announcements.json';

client.once('ready', async () => {
    console.log(`✅ Bot 上線：${client.user.tag}`);

    const channel = await client.channels.fetch(ANNOUNCEMENT_CHANNEL_ID);
    const fetched = await channel.messages.fetch({ limit: 50 });
    const messages = Array.from(fetched.values()).reverse();

    let announcements = [];

    if (fs.existsSync(FILE_PATH)) {
        announcements = JSON.parse(fs.readFileSync(FILE_PATH, 'utf-8'));
    }
    const existingIDs = new Set(announcements.map(a => a.id));

    let newCount = 0;

    for (const msg of messages) {
        if (existingIDs.has(msg.id)) continue;

        let content = msg.content;

        const roleTagRegex = new RegExp(`<@&${ROLE_ID_TO_REMOVE}>`, 'g');
        content = content.replace(roleTagRegex, '');

        const attachments = [...msg.attachments.values()].map(att => att.url);

        announcements.push({
            author: msg.author.username,
            content: content.trim(),
            timestamp: msg.createdAt,
            images: Array.isArray(attachments) ? attachments : [],
            id: msg.id
        });

        newCount++;
    }

    fs.writeFileSync(FILE_PATH, JSON.stringify(announcements, null, 2));
    console.log(`✅ 抓取完成，共新增 ${newCount} 筆公告，總共 ${announcements.length} 筆`);
});

client.on('messageCreate', async (msg) => {
    if (msg.channel.id !== ANNOUNCEMENT_CHANNEL_ID || msg.author.bot) return;

    const roleTag = new RegExp(`<@&${ROLE_ID_TO_REMOVE}>`, 'g');
    const content = msg.content.replace(roleTag, '');

    const attachments = [...msg.attachments.values()].map(att => att.url);

    const newData = {
        author: msg.author.username,
        content: content.trim(),
        timestamp: msg.createdAt,
        images: Array.isArray(attachments) ? attachments : [],
        id: msg.id
    };

    let existing = [];
    try {
        existing = JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'));
    } catch (err) {
        console.error('⚠️ 無法讀取 JSON:', err);
    }

    existing.push(newData);
    fs.writeFileSync(FILE_PATH, JSON.stringify(existing, null, 2));

    console.log(`🆕 已儲存新訊息: ${msg.id}`);
});

client.on('messageDelete', async (msg) => {
    if (msg.channel.id !== ANNOUNCEMENT_CHANNEL_ID) return;

    try {
        const existing = JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'));
        const updated = existing.filter(entry => entry.id !== msg.id);

        fs.writeFileSync(FILE_PATH, JSON.stringify(updated, null, 2));
        console.log(`🗑️ 已刪除訊息: ${msg.id}`);
    } catch (err) {
        console.error('⚠️ 無法刪除訊息:', err);
    }
});

client.login(TOKEN);
