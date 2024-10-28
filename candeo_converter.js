const { light } = require('zigbee-herdsman-converters/lib/modernExtend');
const ota = require('zigbee-herdsman-converters/lib/ota');

const definitions = [

// First part is checking current device details - before OTA update

    {
        fingerprint: [
            { modelID: 'Candeo Zigbee Dimmer' },
            {modelID: 'HK_DIM_A', manufacturerName: 'Shyugj'},
        ],
        model: 'C201 / C202',
        vendor: 'Candeo',
        description: 'Candeo C201 / C202 - local (v1)',
        extend: [light({ configureReporting: true, powerOnBehavior: false })],
        ota: ota.zigbeeOTA,
        meta: {},
    },
    {
        fingerprint: [
            { modelID: 'Candeo Zigbee Dimmer', softwareBuildID: '1.04', dateCode: '20230828' }, 
            { modelID: 'Candeo Zigbee Dimmer', softwareBuildID: '1.20', dateCode: '20240813' },

        ],
        model: 'C201 / C202',
        vendor: 'Candeo',
        description: 'Candeo C201 / C202 - local (v2)',
        extend: [light({ configureReporting: true, levelConfig: { disabledFeatures: ['on_transition_time', 'off_transition_time', 'on_off_transition_time', 'execute_if_off'] }, powerOnBehavior: true })],
        ota: ota.zigbeeOTA,
        meta: {},
    },

// second part is checking for details after update

    {
        fingerprint: [
            { manufacturerName: 'Candeo', modelID: 'C201' },
        ],
        model: 'C201',
        vendor: 'Candeo',
        description: 'Candeo C201 Smart Dimmer Module',
        extend: [light({ configureReporting: true, levelConfig: { disabledFeatures: ['on_transition_time', 'off_transition_time', 'on_off_transition_time', 'execute_if_off'] }, powerOnBehavior: true })],
        ota: ota.zigbeeOTA,
        meta: {},
    },
    {
        fingerprint: [
            { manufacturerName: 'Candeo', modelID: 'C202' },
        ],
        model: 'C202',
        vendor: 'Candeo',
        description: 'Candeo C202 Smart Rotary Dimmer',
        extend: [light({ configureReporting: true, levelConfig: { disabledFeatures: ['on_transition_time', 'off_transition_time', 'on_off_transition_time', 'execute_if_off'] }, powerOnBehavior: true })],
        ota: ota.zigbeeOTA,
        meta: {},
    }


];


module.exports = definitions; 

