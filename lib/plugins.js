const commands = new Map();

const Command = (options) => {
    if (Array.isArray(options)) {
        options.forEach(opt => {
            commands.set(opt.command, {
                ...opt,
                execute: opt.execute,
                cooldown: opt.cooldown || 3000,
                on: opt.on || 'text'
            });
        });
    } else {
        commands.set(options.command, {
            ...options,
            execute: options.execute,
            cooldown: options.cooldown || 3000,
            on: options.on || 'text'
        });
    }
};

const tocooldown = async (user, cmd_name, db) => {
    const key = `cooldown.${cmd_name}.${user}`;
    const u_usage = await db.get(key);
    const now = Date.now();
    if (u_usage && now - u_usage < commands.get(cmd_name).cooldown) {
        const timeLeft = (commands.get(cmd_name).cooldown - (now - u_usage)) / 1000;
        return timeLeft;
    }

    await db.set(key, now);
    return false;
};

const update_cmd_stats = async (cmd_name, user, db) => {
    const statsKey = `stats.commands.${cmd_name}`;
    const stk_key = `stats.users.${user}.commands.${cmd_name}`;
    await Promise.all([
        db.add(statsKey, 1),
        db.add(stk_key, 1),
        db.set(`stats.lastUsed.${cmd_name}`, Date.now())
    ]);
};

const getUserStats = async (user, db) => {
    return await db.get(`stats.users.${user}.commands`) || {};
};

const get_cmd_stats = async (cmd_name, db) => {
    return {
        totalUses: await db.get(`stats.commands.${cmd_name}`) || 0,
        lastUsed: await db.get(`stats.lastUsed.${cmd_name}`) || 0
    };
};

module.exports = { 
    Command, 
    commands, 
    tocooldown,
    update_cmd_stats,
    getUserStats,
    get_cmd_stats
};