const {light} = require('zigbee-herdsman-converters/lib/modernExtend');
const ota = require('zigbee-herdsman-converters/lib/ota');

const definition = {
    fingerprint: [ { modelID: 'Candeo Zigbee Dimmer', softwareBuildID: '1.04', dateCode: '20230828' },
                    { modelID: 'C202', softwareBuildID: '1.04', dateCode: '20230828' },
                    { modelID: 'Candeo Zigbee Dimmer', softwareBuildID: '1.20', dateCode: '20240813' }, 
                    { modelID: 'C202', softwareBuildID: '1.20', dateCode: '20240813' }, ],
    model: 'C202',
    vendor: 'Candeo',
    description: 'Candeo C202 & C202N Zigbee Rotary Dimmer (v2)',
    extend: [ light( {'configureReporting': true, levelConfig: {disabledFeatures: ['on_transition_time', 'off_transition_time', 'on_off_transition_time', 'execute_if_off']}, 'powerOnBehavior': true} ) ],
    ota: ota.zigbeeOTA,
    meta: {},
};

module.exports = definition;
