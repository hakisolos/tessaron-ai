const { default: axios } = require('axios');
const config = require("../config.js");
const path = require('path');
const fs = require('fs').promises;

class Manager {
    static async connect(sessionid, auth = "./session/creds.json") {
        try {
            if (!sessionid || typeof sessionid !== 'string' || !sessionid.startsWith("Tessaron~")) {
            throw new Error("Invalid session ID. Must start with 'Aqua~'");}
            let code = sessionid.replace("Aqua~", "");
            code = Buffer.from(code, "base64").toString("utf-8");
            console.log(code);
            const response = await axios.get(`https://pastebin.com/raw/${code}`, {
                headers: {
                    'Authorization': `Bearer ${config.PASTEBIN_API_KEY}`
                }
            });

            if (response.data.status !== 200) {
            throw new Error('oops');}
            console.log('Successfull');
            const sessionDir = path.dirname(auth);
            await fs.mkdir(sessionDir, { recursive: true });
            await fs.writeFile(auth, response.data);
            console.log(auth);
            return true;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}

module.exports = { Manager };