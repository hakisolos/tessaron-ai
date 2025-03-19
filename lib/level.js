const getLevelDetails = (msg) => {
    const level = Math.floor(msg / 7) + 1;
    const needed = level * 7;
    const progress = msg % 7;
    return { level, needed, progress };
};

const LevelMsg = async (db, user) => {
    const key = `users.${user}.messages`;
    const prev = await db.get(key) || 0;
    const new_cnd = prev + 1;
    await db.set(key, new_cnd);
    const prevL = Math.floor(prev / 7) + 1;
    const Level_one = Math.floor(new_cnd / 7) + 1;
    if (Level_one > prevL) {
        return {
            leveledUp: true,
            Level_one,
            msg: new_cnd
        };
    }

    return {
        leveledUp: false,
        currentLevel: prevL,
        msg: new_cnd
    };
};

const get_stats = async (db, user) => {
    const msg = await db.get(`users.${user}.messages`) || 0;
    return {
        ...getLevelDetails(msg),
        msg
    };
};

module.exports = {
    LevelMsg,
    get_stats,
    getLevelDetails
};