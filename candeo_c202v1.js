const {light} = require('zigbee-herdsman-converters/lib/modernExtend');
const ota = require('zigbee-herdsman-converters/lib/ota');

const definition = {
    fingerprint: [ { modelID: 'Candeo Zigbee Dimmer' },
                    { modelID: 'C202' } ],
    model: 'C202',
    vendor: 'Candeo',
    description: 'Candeo C202 / C202N Zigbee rotary dimmer (v1)',
    extend: [ light( {'configureReporting': true, 'powerOnBehavior': false } ) ],
    ota: ota.zigbeeOTA,
    meta: {},
};

module.exports = definition;
