const fs = require("fs");
const path = require("path");

const mysql = require("mysql2");

const database = () => {
    let connection = null;
    let loadedModels = {};

    const connect = (config) => {
        connection = mysql.createConnection({
            host: config.host,
            port: config.port,
            user: config.username,
            password: config.password,
            database: config.name
        });

        loadModels();
    }

    const loadModels = () => {
        fs.readdirSync(path.join(__dirname, "/models")).forEach((filename) => {
            const model = require(path.join(__dirname, "/models/", filename));
            
            if (typeof(model.init) == "function"){
                model.init(connection);
                loadedModels[filename.replace(".js", "")] = model;
            }
        });
    }

    const close = () => {
        if (connection != null)
            connection.end();
    }

    const models = loadedModels;
    
    return Object.freeze({
        connect,
        models,
        close
    });
}

module.exports = database();