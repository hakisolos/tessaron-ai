const toBool = (str) => {
    if (typeof str === 'boolean') return str;
    if (typeof str === 'string') {
        return str.toLowerCase() === 'true' || str === '1';
    }
    return false;
};

module.exports = {
    toBool,
    prefix: process.env.prefix || "?",
    pastekey: process.env.pastekey || "VvgHwglwdovnKbUgjG0H-zW7lYMgmCO6",
    SESSION_ID: process.env.SESSION_ID || "",
    MONGO_URL: process.env.MONGO_URL || "mongodb+srv://maxwellexcel174:<db_password>@hakixer.sqaab.mongodb.net/?retryWrites=true&w=majority&appName=hakixer",
    public: toBool(process.env.public) ||  "false",
    sudo: process.env.sudo || ["2349112171078@s.whatsapp.net"]
}