const fs = require("fs");
const path = require("path");

const OnOffCapability = require("wirone").capabilities.OnOff;
const ColorCapability = require("wirone").capabilities.ColorSetting;

const statePath = path.join(__dirname, "/../../static/temp/ledBulbState.json");

const ledBulb = () => {
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

    const colorQuery = (globalState) => new Promise((resolve, reject) => {
        resolve({
            instance: "hsv",
            value: {
                h: globalState.color.h,
                s: globalState.color.s,
                v: globalState.color.v
            }
        });
    });

    const colorAction = (state) => new Promise((resolve, reject) => {
        let deviceState = JSON.parse(fs.readFileSync(statePath));
        deviceState.color = state.value;
        fs.writeFileSync(statePath, JSON.stringify(deviceState));

        resolve({
            instance: "hsv",
            action_result: {
                status: "DONE"
            }
        });
    });

    const info = {
        name: "Лампочка",
        type: "devices.types.light",
        globalQuery: globalQuery,

        capabilities: [
            OnOffCapability({
                onQuery: powerQuery,
                onAction: powerAction
            }),
            ColorCapability({
                parameters: {
                    color_model: "hsv"
                },

                onQuery: colorQuery,
                onAction: colorAction
            }),
        ]
    }

    return Object.freeze({
        info
    });
}

module.exports = ledBulb();