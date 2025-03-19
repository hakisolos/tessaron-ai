const { default: makeWASocket, DisconnectReason, makeInMemoryStore, useMultiFileAuthState, Browsers } = require('@whiskeysockets/baileys');
const fs = require("fs").promises;
const path = require("path");  
const Manager = require("./lib/auth");  
const config = require("./config");
const { QuickDB } = require('quick.db');
const { Database } = require('quickmongo');
const P = require('pino');
const { serialize } = require('./lib/message');
const { commands, tocooldown, update_cmd_stats } = require('./lib/plugins');
const { GroupEvent } = require('./lib/welcome');
const messages = require('./lib/messages.json');
const { isOwner } = require('./lib/utils');

const sessionPath = path.join(__dirname, "./lib/session");
/*
(async () => {
    await fs.mkdir(sessionPath, { recursive: true });
    try {
        await Manager.connect(config.SESSION_ID);
    } catch (error) {
        console.error("Error connecting manager:", error);
    }
})();

*/

const db = new Database(config.MONGO_URL);
const qdb = new QuickDB();


async function loadPlugins() {
    const plug = (await fs.readdir("./plugins")).filter(file => file.endsWith(".js"));
    console.log('Initializing plugins:', plug);

    for (const file of plug) {
        require(`./plugins/${file}`);
    }
}

loadPlugins(); 


const start = async () => {
    try {
        console.log("Initializing bot...");
        await db.connect();
        console.log("Database connected successfully!");
        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
        
        const haki = makeWASocket({
            logger: P.default({ level: "silent" }),
            auth: state,
            printQRInTerminal: false,
            browser: Browsers.macOS("chrome"),
            downloadHistory: false,
            syncFullHistory: false,
            markOnlineOnConnect: false,
            generateHighQualityLinkPreview: true,
            defaultQueryTimeoutMs: undefined,
            getMessage: async key => ({ conversation: "tessaron" })
        });

        haki.ev.process(async (events) => {
            if (events['connection.update']) {
                const update = events['connection.update'];
                const { connection, lastDisconnect } = update;
                if (connection === 'close') {
                    if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                        console.log("Reconnecting...");
                        start();
                    }
                } else if (connection === 'open') {
                    console.log('Connected to WhatsAppBot');
                    await haki.sendMessage(haki.user.id, {text: "bot connected"})
                }
            }

            if (events['creds.update']) {
                await saveCreds();
            }

            if (events['group-participants.update']) {
                await GroupEvent(haki, db, events['group-participants.update']);          
            }

            if (events['messages.upsert']) {
                try {
                    const upsert = events['messages.upsert'];
                    for (const msg of upsert.messages) {
                        if (!msg.message || msg.key.fromMe) continue;
                        const message = await serialize(haki, msg);
                        if (!message.message) continue;

                        const { LevelMsg } = require('./lib/level');
                        const res = await LevelMsg(db, message.sender);
                        if (res.leveledUp) {
                            await haki.sendMessage(message.user, {
                                text: `*Congrats* @${message.sender.split('@')[0]}\n*You’ve reached Level* ${res.Level_one}`,
                                mentions: [message.sender]
                            });
                        }

                        // Secure Eval Command
                        if (message.body.startsWith('$')) {
                            const isOwne = await isOwner(db, message.sender);
                            if (!isOwne) return;
                            let code = message.body.slice(1);
                            if (!code) {
                                return haki.sendMessage(message.user, { text: messages.error.noCodeProvided }, { quoted: msg });
                            }
                            try {
                                let evaled = await eval(`(async () => { ${code} })()`); // Execute safely
                                haki.sendMessage(message.user, { text: require('util').inspect(evaled) }, { quoted: msg });
                            } catch (error) {
                                haki.sendMessage(message.user, { text: String(error) }, { quoted: msg });
                            }
                            continue;
                        }

                        // Fix Prefix & Command Detection
                        const p = await db.get('settings.prefix') ?? config.prefix;
                        const isCommand = message.body.startsWith(p);
                        if (isCommand) {
                            if (!config.public && !message.fromMe && !config.sudo.includes(message.sender)) {
                                continue;
                            }
                            const co = message.body.slice(p.length).trim().split(" ")[0].toLowerCase();
                            const command = commands.get(co);
                            if (!command) return;

                            const di = await db.get('settings.allCommandsDisabled');
                            if (di && !['togglecmd'].includes(co)) return message.reply('All commands are currently disabled');

                            const disa = await db.get('settings.disabledCommands') || [];
                            const v = disa.find(cmd => typeof cmd === 'object' && cmd.command === co);
                            if (v) {
                                if (v.time) {
                                    const elapsed = (Date.now() - v.disabledAt) / (1000 * 60);
                                    if (elapsed >= v.time) {
                                        await db.set('settings.disabledCommands', disa.filter(cmd => cmd.command !== co));
                                    } else {
                                        return message.reply(`*Cmd is disabled*\n_Reason_: ${v.reason}\n_Time_: ${Math.ceil(v.time - elapsed)} minutes`);
                                    }
                                } else {
                                    return message.reply(`*Cmd is disabled*\n_Reason_: ${v.reason}`);
                                }
                            }

                            // Fix Cooldown Handling
                            const cooldown = await tocooldown(message.sender, co, db);
                            if (cooldown) {
                                return haki.sendMessage(message.user, {
                                    text: messages.error.cooldown
                                        .replace('{time}', cooldown.toFixed(1))
                                        .replace('{command}', co)
                                }, { quoted: msg });
                            }

                            try {
                                await command.execute(message, { haki, db, qdb });
                                await update_cmd_stats(co, message.sender, db);
                                await message.react("⌛");
                            } catch (error) {
                                console.error(error);
                                haki.sendMessage(message.user, { text: messages.error.command }, { quoted: msg });
                            }
                        }
                    }
                } catch (error) {
                    console.error("Message upsert error:", error);
                }
            }
        });
    } catch (error) {
        console.error("Critical error in start():", error);
        console.log("Restarting bot in 5 seconds...");
        setTimeout(start, 5000);
    }
};

start();
