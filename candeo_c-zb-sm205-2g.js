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
    fingerprint: [{modelID: 'C-ZB-SM205-2G', manufacturerName: 'Candeo'}],
    model: 'C-ZB-SM205-2G',
    vendor: 'Candeo',
    description: 'Candeo C-ZB-SM205-2G Zigbee 2 Gang Switch Module',
    fromZigbee: [fz.on_off, fz.electrical_measurement, fz.metering, fz.power_on_behavior, candeo.fz.switch_type, fz.ignore_genOta],
    toZigbee: [tz.on_off, tz.power_on_behavior, candeo.tz.switch_type],
        exposes: [
            e.switch().withEndpoint('l1'),
            e.switch().withEndpoint('l2'),
            e.power().withEndpoint('e11'),
            e.current().withEndpoint('e11'),
            e.voltage().withEndpoint('e11'),
            e.energy().withEndpoint('e11'),
            e.power_on_behavior(['off', 'on', 'previous']).withEndpoint('l1'),
            e.power_on_behavior(['off', 'on', 'previous']).withEndpoint('l2'),
            e.enum('external_switch_type', ea.ALL, ['momentary', 'toggle']).withLabel('External switch type').withEndpoint('e11')
        ],
        endpoint: (device) => {
            return {'l1': 1, 'l2': 2, 'e11': 11};
        },
        meta: {multiEndpoint: true},
        configure: async (device, coordinatorEndpoint, logger) => {
            const endpoint1 = device.getEndpoint(1);
            const endpoint2 = device.getEndpoint(2);
            await reporting.bind(endpoint1, coordinatorEndpoint, ['genOnOff']);
            await reporting.bind(endpoint2, coordinatorEndpoint, ['genOnOff']);
            await reporting.onOff(endpoint1);
            await reporting.onOff(endpoint2);
            await endpoint1.read('genOnOff', [0x0000]);
            await endpoint2.read('genOnOff', [0x0000]);
            await endpoint1.write('genOnOff', {0x4003: {value: 0xFF, type: 0x30}});
            await endpoint1.read('genOnOff', [0x4003]);
            await endpoint2.write('genOnOff', {0x4003: {value: 0xFF, type: 0x30}});
            await endpoint2.read('genOnOff', [0x4003]);
            const endpoint11 = device.getEndpoint(11);
            await reporting.bind(endpoint11, coordinatorEndpoint, ['haElectricalMeasurement', 'seMetering']);
            await reporting.readEletricalMeasurementMultiplierDivisors(endpoint11);
            await reporting.activePower(endpoint11, {min: 10, change: 50, max: 600});
            await reporting.rmsCurrent(endpoint11, {min: 10, change: 100, max: 600});
            await reporting.rmsVoltage(endpoint11, {min: 10, change: 10, max: 600});
            await reporting.readMeteringMultiplierDivisor(endpoint11);
            await reporting.currentSummDelivered(endpoint11, {min: 10, change: 360000, max: 600});
            await endpoint11.read('haElectricalMeasurement', ['activePower']);
            await endpoint11.read('haElectricalMeasurement', ['rmsCurrent']);
            await endpoint11.read('haElectricalMeasurement', ['rmsVoltage']);
            await endpoint11.read('seMetering', ['currentSummDelivered']);
            await endpoint11.read('genBasic', [switch_type_attribute], { manufacturerCode: manufacturerSpecificClusterCode });
        },
};

module.exports = definition;
