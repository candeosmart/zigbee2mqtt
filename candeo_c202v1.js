const {light} = require('zigbee-herdsman-converters/lib/modernExtend');

const definition = {
    fingerprint: [ { modelID: 'Candeo Zigbee Dimmer' },
                    { modelID: 'C202' } ],
    model: 'C202',
    vendor: 'Candeo',
    description: 'Candeo C202 & C202N Zigbee Rotary Dimmer',
    extend: [ light( {'configureReporting': true, 'powerOnBehavior': false } ) ],
    meta: {},
};

module.exports = definition;
