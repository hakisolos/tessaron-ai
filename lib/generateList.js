
const temp = require('./temp.json');
const { monospace } = require('./utils');

function gepercentList(options) {
    const date = new Date();
    const timeStr = date.toLocaleTimeString();
    const dateStr = date.toLocaleDateString();

    const h = temp.menu.header
        .replace('{botName}', monospace(options.botName))
        .replace('{monoUser}', monospace('User'))
        .replace('{username}', options.username)
        .replace('{monoDate}', monospace('Date'))
        .replace('{date}', dateStr)
        .replace('{monoTime}', monospace('Time'))
        .replace('{time}', timeStr)
        .replace('{monoRAM}', monospace('RAM'))
        .replace('{usedRam}', options.usedRam)
        .replace('{totalRam}', options.totalRam)
        .replace('{monoUptime}', monospace('Uptime'))
        .replace('{hours}', options.hours)
        .replace('{minutes}', options.minutes)
        .replace('{seconds}', options.seconds)
        .replace('{monoMenuList}', monospace('MENU LIST'))
        .replace('{monoPrefix}', monospace('Prefix'))
        .replace('{monoReply}', monospace('Reply with a number to view commands'));

    const li = temp.menu.list
        .replace('{items}', options.items);
    const foot = temp.menu.footer
        .replace('{prefix}', options.prefix);
    return h + li + footer;
}

module.exports = { gepercentList };