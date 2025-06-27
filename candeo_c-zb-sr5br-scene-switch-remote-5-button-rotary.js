const {battery, deviceAddCustomCluster} = require("zigbee-herdsman-converters/lib/modernExtend");
const fz = require("zigbee-herdsman-converters/converters/fromZigbee");
const exposes = require("zigbee-herdsman-converters/lib/exposes");
const utils = require("zigbee-herdsman-converters/lib/utils");
const gs = require("zigbee-herdsman-converters/lib/store");
const {logger} = require("zigbee-herdsman-converters/lib/logger");
const e = exposes.presets;

const manufacturerSpecificClusterCode = 0xFF03;

const candeo = {
    fz:
    {
        rotary_remote_control: {
            cluster: "candeoRotaryRemoteControl",
            type: ["commandRotaryRemoteControl"],
            convert: (model, msg, publish, options, meta) => {
                if (utils.hasAlreadyProcessedMessage(msg, model)) return;
                logger.debug("field1: " + msg.data.field1 + " field2: " + msg.data.field2 + " field3: " + msg.data.field3 + " field4: " + msg.data.field4);
                const messageTypes = { 1: "button_press", 3: "ring_rotation"}
                const messageType = msg.data.field1;
                if (messageType in messageTypes) {
                    let rotary_remote_control_actions = [];
                    if (messageTypes[messageType] == "button_press") {
                        const buttonNumber = msg.data.field3;
                        const buttonAction = msg.data.field4;
                        const buttonNumbers = { 1: "button_1_", 2: "button_2_", 4: "button_3_", 8: "button_4_", 16: "centre_button_" };
                        const buttonActions = { 1 : "click", 2: "double_click", 3: "hold", 4: "release" };
                        if (buttonNumber in buttonNumbers && buttonAction in buttonActions) {         
                            logger.debug("added event for buttonNumber: " + buttonNumbers[buttonNumber] + " buttonAction: " + buttonActions[buttonAction]);               
                            rotary_remote_control_actions.push(buttonNumbers[buttonNumber] + buttonActions[buttonAction]);
                        }
                    }
                    else if (messageTypes[messageType] == "ring_rotation") {
                        const ringAction = msg.data.field3;
                        const ringActions = { 1 : "started_", 2: "stopped_", 3: "continued_"};
                        if (ringAction in ringActions) {
                            if (ringActions[ringAction] == "stopped_") {
                                const previous_direction = gs.getValue(msg.endpoint, "previous_direction");
                                logger.debug("previous_direction: " + previous_direction);   
                                if (previous_direction !== undefined) {
                                    logger.debug("added event for stopped_" + previous_direction);   
                                    rotary_remote_control_actions.push("stopped_" + previous_direction);
                                }
                                gs.putValue(msg.endpoint, "previous_rotation_event", "stopped_");
                            }
                            else {
                                const ringDirection = msg.data.field2;
                                const ringDirections = { 1: "rotating_right", 2: "rotating_left" };
                                if (ringDirection in ringDirections) {
                                    const previous_rotation_event = gs.getValue(msg.endpoint, "previous_rotation_event")
                                    logger.debug("previous_rotation_event: " + previous_rotation_event);   
                                    if (previous_rotation_event !== undefined) {
                                        const ringClicks = msg.data.field4;
                                        if (previous_rotation_event == "stopped_") {
                                            logger.debug("added initial event for ringAction: started_ ringDirection: " + ringDirections[ringDirection]);   
                                            rotary_remote_control_actions.push("started_" + ringDirections[ringDirection]);
                                            gs.putValue(msg.endpoint, "previous_rotation_event", "started_");
                                            if (ringClicks > 1) {
                                                for (let i = 1; i < ringClicks; i++) {
                                                    logger.debug("added " + i + " extra event for ringAction: continued_ ringDirection: " + ringDirections[ringDirection]);   
                                                    rotary_remote_control_actions.push("continued_" + ringDirections[ringDirection]);
                                                }
                                                gs.putValue(msg.endpoint, "previous_rotation_event", "continued_");  
                                            }
                                        }
                                        else if (previous_rotation_event == "started_" || previous_rotation_event == "continued_") {
                                            logger.debug("added initial event for ringAction: continued_ ringDirection: " + ringDirections[ringDirection]);   
                                            rotary_remote_control_actions.push("continued_" + ringDirections[ringDirection]);
                                            if (ringClicks > 1) {
                                                for (let i = 1; i < ringClicks; i++) {
                                                    logger.debug("added " + i + " extra event for ringAction: continued_ ringDirection: " + ringDirections[ringDirection]);   
                                                    rotary_remote_control_actions.push("continued_" + ringDirections[ringDirection]);
                                                }                                            
                                            }
                                            gs.putValue(msg.endpoint, "previous_rotation_event", "continued_");
                                        }
                                    }                                
                                    gs.putValue(msg.endpoint, "previous_direction", ringDirections[ringDirection]);                                
                                }
                            }
                        }
                    }
                    for (let i = 0; i < rotary_remote_control_actions.length; i++) {
                        const payload = {action: rotary_remote_control_actions[i]};
                        utils.addActionGroup(payload, msg, model);
                        publish(payload);
                    }
                }
                return;
            },
        }
    }
}

const definition = {
    fingerprint: [
        { modelID: "C-ZB-SR5BR", manufacturerName: "Candeo" }
    ],
    model: "C-ZB-SR5BR",
    vendor: "Candeo",
    description: "Candeo C-ZB-SR5BR Scene Switch Remote - 5 Button Rotary",
    extend: [        
        battery(),
        deviceAddCustomCluster("candeoRotaryRemoteControl", {
            ID: manufacturerSpecificClusterCode,
            attributes: {},
            commands: { 
                rotaryRemoteControl: {
                    ID: 0x01,
                    parameters: [
                        {name: "field1", type: 0x20},
                        {name: "field2", type: 0x20},
                        {name: "field3", type: 0x20},
                        {name: "field4", type: 0x20},
                    ],
                },
            },
            commandsResponse: {},
        }),
    ],
    fromZigbee: [
        candeo.fz.rotary_remote_control,
        fz.ignore_genOta,
    ],
    exposes: [e.action(["button_1_click", "button_1_double_click", "button_1_hold", "button_1_release", "button_2_click", "button_2_double_click", "button_2_hold", "button_2_release", "button_3_click", "button_3_double_click", "button_3_hold", "button_3_release", "button_4_click", "button_4_double_click", "button_4_hold", "button_4_release", "centre_button_click", "centre_button_double_click", "centre_button_hold", "centre_button_release", "started_rotating_left", "continued_rotating_left", "stopped_rotating_left", "started_rotating_right", "continued_rotating_right", "stopped_rotating_right"])
    ],
    configure: async (device, coordinatorEndpoint, logger) => {
        const endpoint1 = device.getEndpoint(1);        
        await endpoint1.bind(manufacturerSpecificClusterCode, coordinatorEndpoint);
    },
};

module.exports = definition;
