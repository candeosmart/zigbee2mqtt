const fz = require('zigbee-herdsman-converters/converters/fromZigbee');
const tz = require('zigbee-herdsman-converters/converters/toZigbee');
const exposes = require('zigbee-herdsman-converters/lib/exposes');
const reporting = require('zigbee-herdsman-converters/lib/reporting');
const e = exposes.presets;
const ea = exposes.access;

const manufacturerSpecificClusterCode = 0x1224;
const switch_type_attribute = 0x8803;
const data_type = 0x20;
const value_map = {
    0: 'momentary',
    1: 'toggle'
};
const value_lookup = {
    momentary: 0,
    toggle: 1,
};

const candeo = {
    fz:
    {
        switch_type: {
            cluster: 'genBasic',
            type: ['attributeReport', 'readResponse'],
            convert: (model, msg, publish, options, meta) => {
                if (Object.prototype.hasOwnProperty.call(msg.data, switch_type_attribute)) {
                    const value = msg.data[switch_type_attribute];
                    return {
                        external_switch_type: value_map[value] || 'unknown',
                        external_switch_type_numeric: value,
                    };
                }
                return undefined;
            },
        }
    },
    tz:
    {
        switch_type: {
            key: ['external_switch_type'],
            convertSet: async (entity, key, value, meta) => {
                const numericValue = value_lookup[value] ?? parseInt(value, 10);
                await entity.write('genBasic', { [switch_type_attribute]: { value: numericValue, type: data_type } }, { manufacturerCode: manufacturerSpecificClusterCode });
                return { state: { external_switch_type: value } };
            },
            convertGet: async (entity, key, meta) => {
                await entity.read('genBasic', [switch_type_attribute], { manufacturerCode: manufacturerSpecificClusterCode });
            },
        },
    },
}

const definition = {
    fingerprint: [
        { modelID: 'C-ZB-DM204', manufacturerName: 'Candeo' }
    ],
    model: 'C-ZB-DM204',
    vendor: 'Candeo',
    description: 'Candeo C-ZB-DM204 Zigbee Dimmer Module',
    fromZigbee: [
        fz.on_off,
        fz.brightness,
        fz.level_config,
        fz.power_on_behavior,
        fz.electrical_measurement, 
        fz.metering,
        candeo.fz.switch_type,
        fz.ignore_genOta,
    ],
    toZigbee: [
        tz.light_onoff_brightness,
        tz.level_config,
        tz.power_on_behavior,        
        tz.identify,
        candeo.tz.switch_type,
    ],
    exposes: [
        e
            .light()
            .withBrightness()
            .withLevelConfig(['on_transition_time', 'off_transition_time', 'execute_if_off']),
        e.power(),
        e.current(),
        e.voltage(),
        e.energy(),
        e.power_on_behavior(['off', 'on', 'toggle', 'previous']),
        e.identify(),
        e.enum('external_switch_type', ea.ALL, ['momentary', 'toggle']).withLabel('External switch type')],
    meta: {},
    configure: async (device, coordinatorEndpoint, logger) => {
        const endpoint1 = device.getEndpoint(1);
        await reporting.bind(endpoint1, coordinatorEndpoint, ['genOnOff', 'genLevelCtrl']);
        await reporting.onOff(endpoint1);
        await reporting.brightness(endpoint1);
        await endpoint1.read('genOnOff', ['onOff']);
        await endpoint1.write('genOnOff', { 0x4003: { value: 0xff, type: 0x30 } });
        await endpoint1.read('genOnOff', ['startUpOnOff']);
        await endpoint1.read('genLevelCtrl', ['currentLevel']);
        await endpoint1.write('genLevelCtrl', { 0x0011: { value: 0xff, type: 0x20 } });
        await endpoint1.read('genLevelCtrl', ['onLevel']);
        await endpoint1.write('genLevelCtrl', { 0x0010: { value: 0x0a, type: 0x21 } });
        await endpoint1.read('genLevelCtrl', ['onOffTransitionTime']);
        await endpoint1.write('genLevelCtrl', { 0x4000: { value: 0xff, type: 0x20 } });
        await endpoint1.read('genLevelCtrl', ['startUpCurrentLevel']);
        await reporting.bind(endpoint1, coordinatorEndpoint, ['haElectricalMeasurement', 'seMetering']);
        await reporting.readEletricalMeasurementMultiplierDivisors(endpoint1);
        await reporting.activePower(endpoint1, {min: 10, change: 50, max: 600});
        await reporting.rmsCurrent(endpoint1, {min: 10, change: 100, max: 600});
        await reporting.rmsVoltage(endpoint1, {min: 10, change: 10, max: 600});
        await reporting.readMeteringMultiplierDivisor(endpoint1);
        await reporting.currentSummDelivered(endpoint1, {min: 10, change: 360000, max: 600});
        await endpoint1.read('haElectricalMeasurement', ['activePower']);
        await endpoint1.read('haElectricalMeasurement', ['rmsCurrent']);
        await endpoint1.read('haElectricalMeasurement', ['rmsVoltage']);
        await endpoint1.read('seMetering', ['currentSummDelivered']);
        await endpoint1.read('genBasic', [switch_type_attribute], { manufacturerCode: manufacturerSpecificClusterCode });
    },
};

module.exports = definition;
