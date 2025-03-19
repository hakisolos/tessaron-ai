const { proto, getContentType, downloadContentFromMessage, jidNormalizedUser } = require('@whiskeysockets/baileys');

const serialize = async (conn, msg) => {
    if (msg.key) {
        msg.id = msg.key.id;
        msg.user = msg.key.remoteJid;
        msg.fromMe = msg.key.fromMe;
        msg.isGroup = msg.user.endsWith('@g.us');
        msg.sender = msg.isGroup && msg.key.participant ? jidNormalizedUser(msg.key.participant) : jidNormalizedUser(msg.user);
    }

    if (msg.message) {
        msg.type = getContentType(msg.message);
        msg.body = msg.message.conversation || 
                   msg.message.extendedTextMessage?.text || 
                   msg.message.imageMessage?.caption || 
                   msg.message.videoMessage?.caption || 
                   msg.message.documentMessage?.caption || 
                   msg.message.viewOnceMessageV2?.message?.imageMessage?.caption ||
                   msg.message.viewOnceMessageV2?.message?.videoMessage?.caption || '';

        const [cmd, ...args] = msg.body.trim().split(/ +/);
        msg.cmd = cmd;
        msg.args = args;
        msg.text = args.join(' ');

        msg.reply = async (content, options = {}) => {
            if (typeof content === 'string') {
                return conn.sendMessage(msg.user, { text: content }, { quoted: msg });
            }
            return conn.sendMessage(msg.user, content, { quoted: msg });
        };

        msg.send = async (content, options = {}) => {
            if (typeof content === 'string') {
                return conn.sendMessage(msg.user, { text: content }, options);
            }
            return conn.sendMessage(msg.user, content, options);
        };

        msg.react = async (emoji = '✅') => {
            await conn.sendMessage(msg.user, {
                react: {
                    text: emoji,
                    key: msg.key
                }
            });
        };

        if (msg.message.extendedTextMessage?.contextInfo?.quotedMessage) {
            msg.quoted = {
                message: msg.message.extendedTextMessage.contextInfo.quotedMessage,
                sender: jidNormalizedUser(msg.message.extendedTextMessage.contextInfo.participant),
                fromMe: msg.message.extendedTextMessage.contextInfo.participant === conn.user.id,
                type: getContentType(msg.message.extendedTextMessage.contextInfo.quotedMessage),
            };

            msg.quoted.download = async () => {
                const type = msg.quoted.type;
                if (!msg.quoted.message[type]) return null;
                return downloadContentFromMessage(msg.quoted.message[type], type.split('Message')[0]);
            };
        }

        if (msg.type === 'viewOnceMessageV2' && msg.message.viewOnceMessageV2?.message) {
            msg.viewOnce = {
                type: getContentType(msg.message.viewOnceMessageV2.message),
                message: msg.message.viewOnceMessageV2.message
            };
        }

        msg.download = async () => {
            const type = msg.type === 'viewOnceMessageV2' 
                ? getContentType(msg.message.viewOnceMessageV2.message)
                : msg.type;
            
            if (!msg.message[type] && !(msg.message.viewOnceMessageV2?.message?.[type])) {
                return null;
            }

            return downloadContentFromMessage(
                msg.type === 'viewOnceMessageV2' 
                    ? msg.message.viewOnceMessageV2.message[type] 
                    : msg.message[type], 
                type.split('Message')[0]
            );
        };
    }

    return msg;
};

module.exports = { serialize };
