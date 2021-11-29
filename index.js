const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");

const express = require("express");
const app = express();
const wirone = require("wirone");

const oauth = require("./src/oauth/oauth.js");
const config = require("./config.js");

const devices = {
    ledBulb: require("./src/devices/ledBulb.js"),
    kettle: require("./src/devices/kettle.js"),
    temperatureSensor: require("./src/devices/temperatureSensor.js")
};

// Конфигурация wirone
// Обязательные параметры помечены символом *
const wironeConfig = {
    // debug - включает отладочные сообщения об OAuth авторизации, запросах к устройствам и т.д.
    // По умолчанию: false
    debug: true,

    // show_logo - отрисовка ASCII-логотипа при инициализации
    // По умолчанию: false
    show_logo: true,

    // skip_wrong_devices - не выбрасывать ошибки, если обработчик пользовательских устройств (wirone.query(...)) вернул
    // одно или несколько устройств с неверной конфигурацией в объекте info
    // По умолчанию: false
    skip_wrong_devices: true,

    // oauth* - конфигурация OAuth авторизации
    oauth: {
        // client* - идентификатор приложения (client identifier) для реализации связки аккаунтов через OAuth
        client: "wirone",

        // secret* - секрет приложения (client password) для реализации связки аккаунтов через OAuth
        secret: "your_secret_here",

        // lifetime - время жизни токена в секундах
        // По умолчанию: 3600
        lifetime: 3600,

        // authorization_page* - объект с описанием типа используемой страницы для авторизации пользователей
        authorization_page: {
            type: "static_page",
            path: path.join(__dirname + "/static/oauth/index.html")
        },

        // Обрабочики, реализующие логику авторизации
        onAuthorize: oauth.generateCode,
        onGranted: oauth.saveAccessToken,
        onRefresh: oauth.refreshAccessToken,
        onVerify: oauth.verifyAccessToken
    }
}

const init = () => {
    // Создание локальный файлов для хранения состояния некоторых устройств (см. описание функции ниже)
    createDeviceStatesImitation();

    app.use(express.json());
    app.use(express.urlencoded({extended: true}));

    app.use((req, res, next) => {
        console.log("> New " + req.method + " " + req.url + " request from " + req.ip);
        next();
    });

    app.get("/", (req, res) => res.send("OK"));

    // Инициализация wirone с заданной конфигурацией
    wirone.init(app, wironeConfig);

    // Установка обработчика для передачи информации об устройствах пользователя
    wirone.query(queryUserDevices);

    if (config.server.ssl.enabled){
        https.createServer({
            key: fs.readFileSync(config.server.ssl.privateKey),
            ca: fs.readFileSync(config.server.ssl.chain),
            cert: fs.readFileSync(config.server.ssl.certificate)
        }, app).listen(config.server.ports.https, config.server.host, 10, () => {
            console.log("> Server ready with SSL on port " + config.server.ports.https);
        });
    } else {
        http.createServer({}, app).listen(config.server.ports.http, config.server.host, 10, () => {
            console.log("> Server ready on port " + config.server.ports.http);
        });
    }
}

// queryUserDevices - Функция для обработчика wirone.query
const queryUserDevices = (userID) => new Promise((resolve, reject) => {
    // В обработчик передается один параметр - ID авторизированного пользователя

    // Обработчик должен быть реализован как Promise и описывать логику получения устройств для конкретного 
    // пользователя. При успехе обработчик должен вызвать resolve с передачей массива, содержащего объекты 
    // устройств пользователя, в противном случае должен быть вызван reject с сообщением об ошибке.

    if (userID == 1)
        // Список устройств для первого пользоваетля
        resolve([
            devices.ledBulb,
            devices.temperatureSensor
        ]);
    else if (userID == 2)
        // Список устройств для второго пользователя
        resolve([
            devices.kettle
        ]);
    else    
        reject("Access denied for user with ID '" + userID + "'");
});

// createDeviceStatesImitation - Функция для создания файлов с текущим "состоянием" устройств
const createDeviceStatesImitation = () => {
    // Так как в данном примере у устройств ledBulb и kettle, в отличии от temperatureSensor, не реализовано
    // получение данных о состоянии через HTTP запрос, используются локальные файлы для сохранения состояния
    // и имитации управления устройствами

    const tempPath = path.join(__dirname, "/static/temp");

    const ledBulbStatePath = path.join(__dirname, "/static/temp/ledBulbState.json");
    const kettleStatePath = path.join(__dirname, "/static/temp/kettleState.json");

    if (!fs.existsSync(tempPath))
        fs.mkdirSync(tempPath);

    // Стартовое состояние для устройства ledBulb
    if (!fs.existsSync(ledBulbStatePath))
        fs.writeFileSync(ledBulbStatePath, JSON.stringify({
            power: false,
            color: {
                h: 0,
                s: 96,
                v: 100
            }
        }));

    // Стартовое состояние для устройства kettle
    if (!fs.existsSync(kettleStatePath))
        fs.writeFileSync(kettleStatePath, JSON.stringify({
            power: false,
            temperature: 90,
            teaMode: "black_tea",
            waterLevel: 85
        }));
}

init();