const fs = require("fs");
const sha256 = require("sha256");

const database = require("./../database/database.js");
const dbConfig = require("./../../config.js").database;

/*

    generateCode - функция для обработчика onAuthorize

    Обработчик onAuthorize выполняется при отправке POST запроса с данными для аутентификации пользователя 
    с локальной страницы OAuth аутентификации. Запрос, как правило, содержит логин и пароль пользователя.

    В обработчик передаются объекты запроса и ответа (req, res) из Express приложения, а также параметр code -
    сгенерированный временный код для реализации метода Authorization Code Flow.

    Предпологается, что серввер должен сохранить этот код в базу данных при успешной аутентификации, чтобы использовать
    его в дальнейшем для генерации access и refresh токенов.

*/

const generateCode = (req, res, code) => {
    let body = req.body;

    if (body.username == undefined || body.password == undefined)
        return res.json({
            status: "error",
            message: "Ошибка валидации: Не все требуемые поля заполнены"
        });

    database.connect(dbConfig);
    database.models.userModel.get(body.username, body.password)
        .then((user) => {
            if (user == null)
                return res.json({
                    status: "error",
                    message: "Неверное имя пользователя или пароль"
                });                

            return database.models.oauthModel.create(user.id, code);
        })
        .then(() => {
            res.json({
                status: "ok",
                code: code
            });
        })
        .catch((error) => {
            res.json({
                status: "error",
                message: "Внутренняя ошибка сервера",
                info: error
            });
        })
        .finally(() => {
            database.close();
        });
}

/*

    saveAccessToken - функция для обработчика onGranted

    Обработчик onGranted выполняется когда пользователь успешно прошел аутентификацию на странице в браузере, произвел
    редирект со сгенерированным кодом на страницу сервиса Яндекса, который затем отправил запрос на получение
    access и refresh токенов.

    В обработчик передаются два параметра: code - полученный временный код авторизации, который необходимо сверить с ранее
    сохраненным кодом в базе; lifetime - время жизни токена в секундах, указанное в конфигурации Wirone.

    Обработчик onGranted должен быть реализован как Promise и описывать логику генерации и сохранения токенов для пользователя. 
    Если данные были сохранены, в Promise должен быть вызван resolve с объектом, содержащим два поля - accessToken и refreshToken, 
    в которых записаны сгенерированные токены.

    В случае ошибки необходимо вызвать reject с текстом ошибки в качестве аргумента.

*/

const saveAccessToken = (code, lifetime) => new Promise((resolve, reject) => {
    let accessToken = sha256((Date.now() + Math.random()).toString());
    let refreshToken = sha256((Date.now() + Math.random()).toString());

    database.connect(dbConfig);
    database.models.oauthModel.applyTokens(code, accessToken, refreshToken)
        .then((info) => {
            resolve({
                accessToken, 
                refreshToken,
            });
        })
        .catch((error) => {
            reject(error);
        })
        .finally(() => {
            database.close();
        });
});

/*

    refreshAccessToken - функция для обработчика onRefresh

    Обработчик onRefresh выполняется когда сервер Яндекса отправляет запрос на обновление access токена по истечению
    его времени жизни (lifetime).

    В обработчик передается один параметр: oldRefreshToken - ранее полученный сервером Яндекса refresh токен.

    Обработчик onRefresh должен быть реализован как Promise и описыать логику проверки и подтверждения refresh токена,
    а также генерации новых access и refresh токенов.

*/

const refreshAccessToken = (oldRefreshToken) => new Promise((resolve, reject) => {
    let accessToken = sha256((Date.now() + Math.random()).toString());
    let refreshToken = sha256((Date.now() + Math.random()).toString());

    database.connect(dbConfig);
    database.models.oauthModel.refreshToken(oldRefreshToken, accessToken, refreshToken)
        .then((result) => {
            if (result)
                resolve({
                    accessToken,
                    refreshToken
                });
            else
                reject("Unknown refresh token");
        })
        .catch((error) => {
            reject(error);
        })
        .finally(() => {
            database.close();
        });
});

/*

    verifyAccessToken - функция для обработчика onVerify

    Обработчик onVerify выполняется при любом запросе от сервера Яндекса для аутентификации пользователя посредством
    access токена.

    В обработчик передается один параметр: accessToken - токен, который передал сервер Яндекса в запросе.

    Обработчик onVerify должен быть реализован как Promise и описывать логику проверки и подтверждения access токена.
    Если аутентификация прошла успешно, в Promise должен быть вызван resolve, в качестве параметра в который передан id
    пользователя.

*/

const verifyAccessToken = (accessToken) => new Promise((resolve, reject) => {
    database.connect(dbConfig);
    database.models.oauthModel.get(accessToken)
        .then((result) => {
            if (result == null)
                return resolve(false);

            resolve(result.user_id);
        })
        .catch((error) => {
            reject(error);
        })
        .finally(() => {
            database.close();
        });
});

module.exports = {
    generateCode,
    saveAccessToken,
    refreshAccessToken,
    verifyAccessToken
};