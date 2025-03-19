const GroupEvent = async (conn, db, update) => {
    const { id, participants, action } = update;
    const settings = await db.get(`groups.${id}`) || {};
    if (!settings.welcome && !settings.goodbye) return;
    const metadata = await sock.groupMetadata(id);
    const nme = metadata.subject;
    for (const participant of participants) {
        if (action === 'add' && settings.welcome) {
            const wcm = settings.welcomeMessage || 
                `Welcome @${participant.split('@')[0]} to ${nme}`;
            await conn.sendMessage(id, {
                text: wcm,
                mentions: [participant]
            });
        } else if (action === 'remove' && settings.goodbye) {
            const gby = settings.goodbyeMessage || 
                `Goodbye @${participant.split('@')[0]}`;
            await conn.sendMessage(id, {
                text: gby,
                mentions: [participant]
            });
        }
    }
};

module.exports = { GroupEvent };