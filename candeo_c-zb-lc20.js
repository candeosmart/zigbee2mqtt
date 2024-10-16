const {light, identify} = require('zigbee-herdsman-converters/lib/modernExtend');

const definitions = [
    {
        fingerprint: [{modelID: 'C-ZB-LC20-RGBCCT'}],
        model: 'C-ZB-LC20-RGBCCT',
        vendor: 'Candeo',
        description: 'Candeo C-ZB-LC20 Smart LED Controller (RGBCCT Mode)',
        extend: [ light({colorTemp: {range: [158, 500]}, color: {modes: ['xy', 'hs'], enhancedHue: true}, configureReporting: true, levelConfig: {disabledFeatures: ['on_transition_time', 'off_transition_time', 'on_off_transition_time', 'on_level', 'execute_if_off']}, 'powerOnBehavior': true}), identify() ],
        meta: {},
    },
    {
        fingerprint: [{modelID: 'C-ZB-LC20-RGBW'}],
        model: 'C-ZB-LC20-RGBW',
        vendor: 'Candeo',
        description: 'Candeo C-ZB-LC20 Smart LED Controller (RGBW Mode)',
        extend: [ light({colorTemp: {range: [158, 500]}, color: {modes: ['xy', 'hs'], enhancedHue: true}, configureReporting: true, levelConfig: {disabledFeatures: ['on_transition_time', 'off_transition_time', 'on_off_transition_time', 'on_level', 'execute_if_off']}, 'powerOnBehavior': true}), identify() ],
        meta: {},
    },
    {
        fingerprint: [{modelID: 'C-ZB-LC20-RGB'}],
        model: 'C-ZB-LC20-RGB',
        vendor: 'Candeo',
        description: 'Candeo C-ZB-LC20 Smart LED Controller (RGB Mode)',
        extend: [ light({color: {modes: ['xy', 'hs'], enhancedHue: true}, configureReporting: true, levelConfig: {disabledFeatures: ['on_transition_time', 'off_transition_time', 'on_off_transition_time', 'on_level', 'execute_if_off']}, 'powerOnBehavior': true}), identify() ],
        meta: {},
    },
    {
        fingerprint: [{modelID: 'C-ZB-LC20-CCT'}],
        model: 'C-ZB-LC20-CCT',
        vendor: 'Candeo',
        description: 'Candeo C-ZB-LC20 Smart LED Controller (CCT Mode)',
        extend: [ light({colorTemp: {range: [158, 500]}, configureReporting: true, levelConfig: {disabledFeatures: ['on_transition_time', 'off_transition_time', 'on_off_transition_time', 'on_level', 'execute_if_off']}, 'powerOnBehavior': true}), identify() ],
        meta: {},
    },
    {
        fingerprint: [{modelID: 'C-ZB-LC20-Dim'}],
        model: 'C-ZB-LC20-Dim',
        vendor: 'Candeo',
        description: 'Candeo C-ZB-LC20 Smart LED Controller (Dimmer Mode)',
        extend: [ light({configureReporting: true, levelConfig: {disabledFeatures: ['on_transition_time', 'off_transition_time', 'on_off_transition_time', 'on_level', 'execute_if_off']}, 'powerOnBehavior': true}), identify() ],
        meta: {},
    }
];

module.exports = definitions;
