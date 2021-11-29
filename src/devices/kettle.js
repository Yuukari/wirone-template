const fs = require("fs");
const path = require("path");

const OnOffCapability = require("wirone").capabilities.OnOff;
const RangeCapability = require("wirone").capabilities.Range;
const ModeCapability = require("wirone").capabilities.Mode;

const FloatProperty = require("wirone").properties.Float;

const statePath = path.join(__dirname, "/../../static/temp/kettleState.json");

const kettle = () => {
    const globalQuery = () => new Promise((resolve, reject) => {        
        let deviceState = JSON.parse(fs.readFileSync(statePath));
        resolve(deviceState);
    });

    const powerQuery = (globalState) => new Promise((resolve, reject) => {
        resolve({
            instance: "on",
            value: globalState.power
        });
    });

    const powerAction = (state) => new Promise((resolve, reject) => {
        let deviceState = JSON.parse(fs.readFileSync(statePath));
        deviceState.power = state.value;
        fs.writeFileSync(statePath, JSON.stringify(deviceState));

        resolve({
            instance: "on",
            action_result: {
                status: "DONE"
            }
        });
    });

    const temperatureQuery = (globalState) => new Promise((resolve, reject) => {
        resolve({
            instance: "temperature",
            value: globalState.temperature
        });
    });

    const temperatureAction = (state) => new Promise((resolve, reject) => {
        let deviceState = JSON.parse(fs.readFileSync(statePath));
        deviceState.temperature = state.value;
        fs.writeFileSync(statePath, JSON.stringify(deviceState));

        resolve({
            instance: "temperature",
            action_result: {
                status: "DONE"
            }
        });
    });

    const modeQuery = (globalState) => new Promise((resolve, reject) => {
        resolve({
            instance: "tea_mode",
            value: globalState.teaMode
        });
    });

    const modeAction = (state) => new Promise((resolve, reject) => {
        let deviceState = JSON.parse(fs.readFileSync(statePath));
        deviceState.teaMode = state.value;
        fs.writeFileSync(statePath, JSON.stringify(deviceState));

        resolve({
            instance: "tea_mode",
            action_result: {
                status: "DONE"
            }
        });
    });

    const waterLevelQuery = (globalState) => new Promise((resolve, reject) => {
        resolve({
            instance: "water_level",
            value: globalState.waterLevel
        });
    });

    const info = {
        name: "Чайник",
        type: "devices.types.cooking.kettle",
        globalQuery: globalQuery,

        capabilities: [
            OnOffCapability({
                onQuery: powerQuery,
                onAction: powerAction
            }),
            RangeCapability({
                parameters: {
                    instance: "temperature",
                    unit: "unit.temperature.celsius",
                    range: {
                        min: 60,
                        max: 100
                    }
                },

                onQuery: temperatureQuery,
                onAction: temperatureAction
            }),
            ModeCapability({
                parameters: {
                    instance: "tea_mode",
                    modes: [
                        { value: "black_tea" },
                        { value: "flower_tea" },
                        { value: "green_tea" },
                        { value: "herbal_tea" },
                        { value: "oolong_tea" },
                        { value: "puerh_tea" },
                        { value: "red_tea" },
                        { value: "white_tea" },
                    ]
                },

                onQuery: modeQuery,
                onAction: modeAction
            })
        ],
        properties: [
            FloatProperty({
                parameters: {
                    instance: "water_level",
                    unit: "unit.percent"
                },

                onQuery: waterLevelQuery
            })
        ]
    }

    return Object.freeze({
        info
    });
}

module.exports = kettle();