const {light} = require('zigbee-herdsman-converters/lib/modernExtend');

const definition = {
    fingerprint: [ { modelID: 'Candeo Zigbee Dimmer', softwareBuildID: '1.04', dateCode: '20230828' },
                    { modelID: 'C202', softwareBuildID: '1.04', dateCode: '20230828' } ],
    model: 'C202',
    vendor: 'Candeo',
    description: 'Candeo C202 / C202N Zigbee rotary dimmer (with or without neutral)',
    extend: [ light( { 'configureReporting': true, levelConfig: { disabledFeatures: [ 'on_transition_time', 'off_transition_time', 'on_off_transition_time', 'execute_if_off' ] }, 'powerOnBehavior': true } ) ],
    meta: {},
};

module.exports = definition;
