const oauthModel = () => {
    let connection = null;

    const init = (conn) => {
        connection = conn;
    }

    const create = (userId, code) => new Promise((resolve, reject) => {
        let ts = Date.now();

        connection.execute("INSERT INTO oauth (user_id, code, created_at, expires_at) VALUES (?, ?, ?, ?)", [
            userId, 
            code, 
            new Date(ts).toISOString(),
            new Date(ts + 3600 * 1000).toISOString()
        ], (error, info) => {
            if (error != null)
                return reject(error);

            resolve(info);
        });
    });

    const applyTokens = (code, accessToken, refreshToken) => new Promise((resolve, reject) => {
        connection.execute("UPDATE oauth SET access_token = ?, refresh_token = ? WHERE code = ?", [
            accessToken, 
            refreshToken, 
            code
        ], (error, info) => {
            if (error != null)
                return reject(error);

            resolve(info);
        });
    });

    const get = (accessToken) => new Promise((resolve, reject) => {
        connection.execute("SELECT * FROM oauth WHERE access_token = ? LIMIT 1", [accessToken], (error, rows) => {
            if (error != null)
                return reject(error);

            resolve(rows[0] != undefined ? rows[0] : null);
        })
    });

    const refreshToken = (oldRefreshToken, accessToken, refreshToken) => new Promise((resolve, reject) => {
        connection.execute("SELECT * FROM oauth WHERE refresh_token = ? LIMIT 1", [oldRefreshToken], (error, rows) => {
            if (error != null)
                return reject(error);

            if (rows.length == 0)
                return resolve(false);

            connection.execute("UPDATE oauth SET access_token = ?, refresh_token = ?, expires_at = ? WHERE refresh_token = ?", [
                accessToken, 
                refreshToken, 
                new Date(Date.now() + 3600 * 1000).toISOString(),
                oldRefreshToken,
            ], (error, info) => {
                if (error != null)
                    return reject(error);
    
                resolve(true);
            });
        });
    });

    return Object.freeze({
        init,
        create,
        applyTokens,
        get,
        refreshToken
    });
}

module.exports = oauthModel();