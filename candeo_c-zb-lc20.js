const fz = require('zigbee-herdsman-converters/converters/fromZigbee');
const tz = require('zigbee-herdsman-converters/converters/toZigbee');
const constants = require('zigbee-herdsman-converters/lib/constants');
const exposes = require('zigbee-herdsman-converters/lib/exposes');
const reporting = require('zigbee-herdsman-converters/lib/reporting');
const light = require('zigbee-herdsman-converters/lib/light');
const utils = require('zigbee-herdsman-converters/lib/utils');
const libColor = require('zigbee-herdsman-converters/lib/color');
const e = exposes.presets;

// This device has limited memory for storing Cluster / Attribute reporting.

// The default modernExtend behaviour configures too many Cluster / Attribute combinations so the device throws an "Insufficient Space" error after 4 Cluster / Attribute combinations.

// Since the reporting configuration therefore fails, the UI does not update correctly after sending commands.

// Which parts of the UI don't update depend on where the configuration fails i.e. what order the reporting of the Cluster / Attribute pairs are configured in

// This "old style" converter attempts to work around this by:

// 1) Only using XY color rather than both XY & HS 
// 2) Only configuring reporting for OnOff, Level and CurrentX / CurrentY (i.e. stopping after 4 Cluster / Attribute combinations)
// 3) Using a custom light_colortemp that reads the colorTemperature Attribute manually after a Move To ColorTemp Command

// This is based on similar workarounds in Hubitat & SmartThings.

const candeo = {
    candeo_tz: {
        light_colortemp: {
            key: ['color_temp', 'color_temp_percent'],
            options: [exposes.options.color_sync(), exposes.options.transition()],
            convertSet: async (entity, key, value, meta) => {
                const [colorTempMin, colorTempMax] = light.findColorTempRange(entity);
                const preset = { warmest: colorTempMax, warm: 454, neutral: 370, cool: 250, coolest: colorTempMin };

                if (key === 'color_temp_percent') {
                    utils.assertNumber(value);
                    value = utils
                        .mapNumberRange(value, 0, 100, colorTempMin != null ? colorTempMin : 154, colorTempMax != null ? colorTempMax : 500)
                        .toString();
                }

                if (utils.isString(value) && value in preset) {
                    value = utils.getFromLookup(value, preset);
                }

                value = Number(value);

                // ensure value within range
                utils.assertNumber(value);
                value = light.clampColorTemp(value, colorTempMin, colorTempMax);

                const payload = { colortemp: value, transtime: utils.getTransition(entity, key, meta).time };
                await entity.command('lightingColorCtrl', 'moveToColorTemp', payload, utils.getOptions(meta.mapped, entity));
                await entity.read('lightingColorCtrl', ['colorMode', 'colorTemperature']);
                return {
                    state: libColor.syncColorState({ color_mode: constants.colorModeLookup[2], color_temp: value }, meta.state, entity, meta.options),
                    readAfterWriteTime: payload.transtime * 100,
                };
            },
            convertGet: async (entity, key, meta) => {
                await entity.read('lightingColorCtrl', ['colorMode', 'colorTemperature']);
            },
        }
    },
};

const definitions = [
    {
        fingerprint: [{ modelID: 'C-ZB-LC20-RGBCCT', manufacturerName: 'Candeo' }],
        model: 'C-ZB-LC20-RGBCCT',
        vendor: 'Candeo',
        description: 'Candeo C-ZB-LC20 Smart LED Controller (RGBCCT Mode)',
        fromZigbee: [
            fz.on_off,
            fz.brightness,
            fz.ignore_basic_report,
            fz.level_config,
            fz.color_colortemp,
            fz.power_on_behavior
        ],
        toZigbee: [
            tz.light_onoff_brightness,
            tz.ignore_transition,
            tz.level_config,
            tz.ignore_rate,
            tz.light_brightness_move,
            tz.light_brightness_step,
            candeo.candeo_tz.light_colortemp,
            tz.light_color,
            tz.light_color_mode,
            tz.light_color_options,
            tz.light_colortemp_move,
            tz.light_colortemp_step,
            tz.light_colortemp_startup,
            tz.light_hue_saturation_move,
            tz.light_hue_saturation_step,
            tz.identify,
            tz.power_on_behavior
        ],
        exposes: [
            e
                .light()
                .withBrightness()
                .withColorTemp([158, 500])
                .withColorTempStartup([158, 500])
                .withColor(['xy'])
                .withLevelConfig(['on_transition_time', 'off_transition_time', 'on_off_transition_time', 'on_level', 'execute_if_off']),
            e.power_on_behavior(['off', 'on', 'toggle', 'previous']),
            e.identify()
        ],
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpoint = device.getEndpoint(11);
            await reporting.bind(endpoint, coordinatorEndpoint, ['genOnOff', 'genLevelCtrl', 'lightingColorCtrl']);
            await reporting.onOff(endpoint);
            await reporting.brightness(endpoint);
            const x = reporting.payload('currentX', 10, 3600, 1);
            await endpoint.configureReporting('lightingColorCtrl', x);
            const y = reporting.payload('currentY', 10, 3600, 1);
            await endpoint.configureReporting('lightingColorCtrl', y);
            await endpoint.read('genOnOff', ['onOff']);
            await endpoint.write('genOnOff', { 0x4003: { value: 0xff, type: 0x30 } });
            await endpoint.read('genOnOff', ['startUpOnOff']);
            await endpoint.read('genLevelCtrl', ['currentLevel']);
            await endpoint.write('genLevelCtrl', { 0x4000: { value: 0xff, type: 0x20 } });
            await endpoint.read('genLevelCtrl', ['startUpCurrentLevel']);
            await endpoint.write('lightingColorCtrl', { 0x4010: { value: 0xffff, type: 0x21 } });
            await endpoint.read('lightingColorCtrl', ['currentX', 'currentY', 'colorMode', 'colorTemperature', 'startUpColorTemperature']);
        },
        meta: {},
    },
    {
        fingerprint: [{ modelID: 'C-ZB-LC20-RGBW', manufacturerName: 'Candeo' }],
        model: 'C-ZB-LC20-RGBW',
        vendor: 'Candeo',
        description: 'Candeo C-ZB-LC20 Smart LED Controller (RGBW Mode)',
        fromZigbee: [
            fz.on_off,
            fz.brightness,
            fz.ignore_basic_report,
            fz.level_config,
            fz.color_colortemp,
            fz.power_on_behavior
        ],
        toZigbee: [
            tz.light_onoff_brightness,
            tz.ignore_transition,
            tz.level_config,
            tz.ignore_rate,
            tz.light_brightness_move,
            tz.light_brightness_step,
            candeo.candeo_tz.light_colortemp,
            tz.light_color,
            tz.light_color_mode,
            tz.light_color_options,
            tz.light_colortemp_move,
            tz.light_colortemp_step,
            tz.light_colortemp_startup,
            tz.light_hue_saturation_move,
            tz.light_hue_saturation_step,
            tz.identify,
            tz.power_on_behavior
        ],
        exposes: [
            e
                .light()
                .withBrightness()
                .withColorTemp([158, 500])
                .withColorTempStartup([158, 500])
                .withColor(['xy'])
                .withLevelConfig(['on_transition_time', 'off_transition_time', 'on_off_transition_time', 'on_level', 'execute_if_off']),
            e.power_on_behavior(['off', 'on', 'toggle', 'previous']),
            e.identify()
        ],
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpoint = device.getEndpoint(11);
            await reporting.bind(endpoint, coordinatorEndpoint, ['genOnOff', 'genLevelCtrl', 'lightingColorCtrl']);
            await reporting.onOff(endpoint);
            await reporting.brightness(endpoint);
            const x = reporting.payload('currentX', 10, 3600, 1);
            await endpoint.configureReporting('lightingColorCtrl', x);
            const y = reporting.payload('currentY', 10, 3600, 1);
            await endpoint.configureReporting('lightingColorCtrl', y);
            await endpoint.read('genOnOff', ['onOff']);
            await endpoint.write('genOnOff', { 0x4003: { value: 0xff, type: 0x30 } });
            await endpoint.read('genOnOff', ['startUpOnOff']);
            await endpoint.read('genLevelCtrl', ['currentLevel']);
            await endpoint.write('genLevelCtrl', { 0x4000: { value: 0xff, type: 0x20 } });
            await endpoint.read('genLevelCtrl', ['startUpCurrentLevel']);
            await endpoint.write('lightingColorCtrl', { 0x4010: { value: 0xffff, type: 0x21 } });
            await endpoint.read('lightingColorCtrl', ['currentX', 'currentY', 'colorMode', 'colorTemperature', 'startUpColorTemperature']);
        },
        meta: {},
    },
    {
        fingerprint: [{ modelID: 'C-ZB-LC20-RGB', manufacturerName: 'Candeo' }],
        model: 'C-ZB-LC20-RGB',
        vendor: 'Candeo',
        description: 'Candeo C-ZB-LC20 Smart LED Controller (RGB Mode)',
        fromZigbee: [
            fz.on_off,
            fz.brightness,
            fz.ignore_basic_report,
            fz.level_config,
            fz.color_colortemp,
            fz.power_on_behavior
        ],
        toZigbee: [
            tz.light_onoff_brightness,
            tz.ignore_transition,
            tz.level_config,
            tz.ignore_rate,
            tz.light_brightness_move,
            tz.light_brightness_step,
            tz.light_color,
            tz.light_color_mode,
            tz.light_color_options,
            tz.light_hue_saturation_move,
            tz.light_hue_saturation_step,
            tz.identify,
            tz.power_on_behavior
        ],
        exposes: [
            e
                .light()
                .withBrightness()
                .withColor(['xy'])
                .withLevelConfig(['on_transition_time', 'off_transition_time', 'on_off_transition_time', 'on_level', 'execute_if_off']),
            e.power_on_behavior(['off', 'on', 'toggle', 'previous']),
            e.identify()
        ],
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpoint = device.getEndpoint(11);
            await reporting.bind(endpoint, coordinatorEndpoint, ['genOnOff', 'genLevelCtrl', 'lightingColorCtrl']);
            await reporting.onOff(endpoint);
            await reporting.brightness(endpoint);
            const x = reporting.payload('currentX', 10, 3600, 1);
            await endpoint.configureReporting('lightingColorCtrl', x);
            const y = reporting.payload('currentY', 10, 3600, 1);
            await endpoint.configureReporting('lightingColorCtrl', y);
            await endpoint.read('genOnOff', ['onOff']);
            await endpoint.write('genOnOff', { 0x4003: { value: 0xff, type: 0x30 } });
            await endpoint.read('genOnOff', ['startUpOnOff']);
            await endpoint.read('genLevelCtrl', ['currentLevel']);
            await endpoint.write('genLevelCtrl', { 0x4000: { value: 0xff, type: 0x20 } });
            await endpoint.read('genLevelCtrl', ['startUpCurrentLevel']);
            await endpoint.read('lightingColorCtrl', ['currentX', 'currentY', 'colorMode']);
        },
        meta: {},
    },
    {
        fingerprint: [{ modelID: 'C-ZB-LC20-CCT', manufacturerName: 'Candeo' }],
        model: 'C-ZB-LC20-CCT',
        vendor: 'Candeo',
        description: 'Candeo C-ZB-LC20 Smart LED Controller (CCT Mode)',
        fromZigbee: [
            fz.on_off,
            fz.brightness,
            fz.ignore_basic_report,
            fz.level_config,
            fz.color_colortemp,
            fz.power_on_behavior
        ],
        toZigbee: [
            tz.light_onoff_brightness,
            tz.ignore_transition,
            tz.level_config,
            tz.ignore_rate,
            tz.light_brightness_move,
            tz.light_brightness_step,
            tz.light_colortemp,
            tz.light_colortemp_move,
            tz.light_colortemp_step,
            tz.light_colortemp_startup,
            tz.identify,
            tz.power_on_behavior
        ],
        exposes: [
            e
                .light()
                .withBrightness()
                .withColorTemp([158, 500])
                .withColorTempStartup([158, 500])
                .withLevelConfig(['on_transition_time', 'off_transition_time', 'on_off_transition_time', 'on_level', 'execute_if_off']),
            e.power_on_behavior(['off', 'on', 'toggle', 'previous']),
            e.identify()
        ],
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpoint = device.getEndpoint(11);
            await reporting.bind(endpoint, coordinatorEndpoint, ['genOnOff', 'genLevelCtrl', 'lightingColorCtrl']);
            await reporting.onOff(endpoint);
            await reporting.brightness(endpoint);
            const colorTemperature = reporting.payload('colorTemperature', 10, 3600, 1);
            await endpoint.configureReporting('lightingColorCtrl', colorTemperature);
            await endpoint.read('genOnOff', ['onOff']);
            await endpoint.write('genOnOff', { 0x4003: { value: 0xff, type: 0x30 } });
            await endpoint.read('genOnOff', ['startUpOnOff']);
            await endpoint.read('genLevelCtrl', ['currentLevel']);
            await endpoint.write('genLevelCtrl', { 0x4000: { value: 0xff, type: 0x20 } });
            await endpoint.read('genLevelCtrl', ['startUpCurrentLevel']);
            await endpoint.write('lightingColorCtrl', { 0x4010: { value: 0xffff, type: 0x21 } });
            await endpoint.read('lightingColorCtrl', ['colorMode', 'colorTemperature', 'startUpColorTemperature']);
        },
        meta: {},
    },
    {
        fingerprint: [{ modelID: 'C-ZB-LC20-Dim' }],
        model: 'C-ZB-LC20-Dim',
        vendor: 'Candeo',
        description: 'Candeo C-ZB-LC20 Smart LED Controller (Dim Mode)',
        fromZigbee: [
            fz.on_off,
            fz.brightness,
            fz.ignore_basic_report,
            fz.level_config,
            fz.power_on_behavior
        ],
        toZigbee: [
            tz.light_onoff_brightness,
            tz.ignore_transition,
            tz.level_config,
            tz.ignore_rate,
            tz.light_brightness_move,
            tz.light_brightness_step,
            tz.identify,
            tz.power_on_behavior
        ],
        exposes: [
            e
                .light()
                .withBrightness()
                .withLevelConfig(['on_transition_time', 'off_transition_time', 'on_off_transition_time', 'on_level', 'execute_if_off']),
            e.power_on_behavior(['off', 'on', 'toggle', 'previous']),
            e.identify()
        ],
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpoint = device.getEndpoint(11);
            await reporting.bind(endpoint, coordinatorEndpoint, ['genOnOff', 'genLevelCtrl']);
            await reporting.onOff(endpoint);
            await reporting.brightness(endpoint);
            await endpoint.read('genOnOff', ['onOff']);
            await endpoint.write('genOnOff', { 0x4003: { value: 0xff, type: 0x30 } });
            await endpoint.read('genOnOff', ['startUpOnOff']);
            await endpoint.read('genLevelCtrl', ['currentLevel']);
            await endpoint.write('genLevelCtrl', { 0x4000: { value: 0xff, type: 0x20 } });
            await endpoint.read('genLevelCtrl', ['startUpCurrentLevel']);
        },
        meta: {},
    }
];

module.exports = definitions;
