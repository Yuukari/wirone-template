// Датчик температуры, получающий данные о температуре, влажности воздуха и атмосферном давлении через OpenWeatherMap API

const request = require("request");

const FloatPropery = require("wirone").properties.Float;

const temperatureSensor = () => {
    // В этом примере используется функция globalQuery для получения и устновки глобального состояния устройства

    // Функция globalQuery выполняется при запросе состояния устройства, и позволяет установить глобальное состояние,
    // данные из которого в дальнейшем можно использовать для присвоения значений умений и встроенных датчиков

    // Как правило, в этой функции реализуется получение информации о состоянии вашего устройства через специфичный 
    // API устройств умного дома (например, запрос к датчику температуры, находящегося в локальной сети)
    const globalQuery = () => new Promise((resolve, reject) => {
        const API_key = "2e55c1139ea49c19fea988ae7fe37d4b";

        // Отправка запроса на API OpenWeatherMap для получения информации о погоде в Москве
        request({
            url: "https://api.openweathermap.org/data/2.5/weather?q=Moscow&units=metric&appid=" + API_key
        }, (error, response, body) => {
            let json = JSON.parse(body);

            // Если в процессе запроса произошла ошибка, необходимо вызвать reject с кодом ошибки из документации
            // Подробнее про коды ошибок можно прочитать здесь: https://yandex.ru/dev/dialogs/smart-home/doc/concepts/response-codes.html
            if (error != null)
                return reject("INTERNAL_ERROR");

            // При успешном выполнении запроса записываем данные из запроса в глобальное состояние устройства, передавая
            // объект с данными как параметр в resolve
            resolve({
                temperature: json.main.temp,
                humidity: json.main.humidity,
                pressure: json.main.pressure * 0.750064
            });
        });
    });

    // Обработчик состояния для встроенного датчика Float с функцией "temperature"
    const temperatureQuery = (globalState) => new Promise((resolve, reject) => {
        // Обработчики состояний должны быть реализованы как Promise

        // Если была использована функция globalQuery, объект, который был передан в resolve, доступен через параметр globalState
        // в любом обработчике состояния

        // В случае успеха вызывается resolve с передачей объекта, который описывает состояние умения или встроенного датчика
        // Пример ответа для встроенного датчика Float: https://yandex.ru/dev/dialogs/smart-home/doc/concepts/float.html#state__example
        resolve({
            instance: "temperature",
            // Установка значения температуры из объекта globalState
            value: globalState.temperature
        });
    });

    // Аналогичные обработчики для датчиков влажности и давления
    const humidityQuery = (globalState) => new Promise((resolve, reject) => {
        resolve({
            instance: "humidity",
            value: globalState.humidity
        });
    });

    const pressureQuery = (globalState) => new Promise((resolve, reject) => {
        resolve({
            instance: "pressure",
            value: globalState.pressure
        });
    });

    // Объект с информацией об устройстве
    // Может включать в себя параметры, описанные в документации: https://yandex.ru/dev/dialogs/smart-home/doc/reference/get-devices.html#output-structure
    const info = {
        // Имя устройства
        name: "Метеостанция",

        // Тип устройства
        // Доступные типы устройств описаны в документации: https://yandex.ru/dev/dialogs/smart-home/doc/concepts/device-types.html
        type: "devices.types.sensor",

        // Установка обработчика глобального состояния
        globalQuery: globalQuery,

        // Объект properties с описанием встроенных датчиков устройтва
        properties: [
            // Описание встроенного датчика температуры

            // При описании умений и встроенных датчиков используется объект с параметрами, приведенный в документации,
            // например: https://yandex.ru/dev/dialogs/smart-home/doc/concepts/float.html#discovery__parameters
            FloatPropery({ 
                parameters: {
                    instance: "temperature",
                    unit: "unit.temperature.celsius"
                },

                // Установка обработчика состояния для данного датчика
                onQuery: temperatureQuery
            }),

            // Описание остальных датчиков устройства
            FloatPropery({
                parameters: {
                    instance: "humidity",
                    unit: "unit.percent"
                },

                onQuery: humidityQuery
            }),
            FloatPropery({
                parameters: {
                    instance: "pressure",
                    unit: "unit.pressure.mmhg"
                },

                onQuery: pressureQuery
            })
        ]
    }

    // Устройство обязательно должно возвращать объект с информацией о нем
    return Object.freeze({
        info
    });
}

module.exports = temperatureSensor();