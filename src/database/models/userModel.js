const sha256 = require("sha256");

const userModel = () => {
    let connection = null;

    const init = (conn) => {
        connection = conn;
    }

    const get = (username, password) => new Promise((resolve, reject) => {
        connection.execute("SELECT * FROM users WHERE username = ? AND password = ? LIMIT 1", [
            username, 
            sha256(password)
        ], (error, rows) => {
            if (error != null)
                return reject(error);

            resolve(rows[0] != undefined ? rows[0] : null);
        })
    });

    return Object.freeze({
        init,
        get
    });
}

module.exports = userModel();