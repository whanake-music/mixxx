// eslint-disable-next-line-no-var
var Prime4 = {};

// Would you like each deck to show the colour of its loaded track (if specified)?
// (Choose between true or false)
//const showTrackColor = false; // NOT IMPLEMENTED YET

// What default colour would you like each deck to be?
/*
 * "red",
 * "green",
 * "blue",
 * "yellow",
 * "magenta",
 * "cyan",
 * "orange",
 * "aqua",
 * "violet",
 * "white",
 */

const deckColors = [

    // Deck 1
    "green",

    // Deck 2
    "blue",

    // Deck 3
    "red",

    // Deck 4
    "yellow",

];

// Would you like the TRACK SKIP ([|<<] and [>>|] buttons) to jump to the start and
// end of the track, or seek through it? (Choose "seek" or "skip")
const skipButtonBehaviour = "skip";

// How sensitive should the jog wheel be when nudging (while playing) or navigating
// (while paused) a track? (NOTE: 0.2 is a good value to start with. The larger the
// number, the more sensitive the wheel will be.)
const wheelSensitivity = 0.5;

// Edit the values in this list to choose which tempo fader ranges you would like
// to toggle through using [SHIFT} + Pitch bend [-] / [+] (0.5 = 50%).
const rateRanges = [
    0.04,
    0.08,
    0.24,
    0.5,
    0.9
];

/**************************************************
 *                                                *
 *                   WARNING!!!                   *
 *                                                *
 *      DO NOT EDIT ANYTHING PAST THIS POINT      *
 *       UNLESS YOU KNOW WHAT YOU'RE DOING.       *
 *                                                *
 **************************************************/

// Convert user-preference for `skipButtonBehaviour` into appropriate keys for components
let trackSkipMode = [];
if (skipButtonBehaviour === "skip") {
    trackSkipMode = ["start", "end"];
} else if (skipButtonBehaviour === "seek") {
    trackSkipMode = ["back", "fwd"];
}

// Beatjump sizes
const jumpSizes = [1, 2, 4, 8, 16, 32, 64, 128];

// Component re-jigging for pad mode purposes
components.ComponentContainer.prototype.reconnectComponents = function(operation, recursive) {
    this.forEachComponent(function(component) {
        component.disconnect();
        if (typeof operation === "function") {
            operation.call(this, component);
        }
        if (component.outConnect) { component.connect(); }
        if (component.outTrigger) { component.trigger(); }
    }, recursive);
};

// 'Off' value sets lights to dim instead of off
components.Button.prototype.off = 0x01;

// Function to send specific RGB values through SysEx messages
const sendSysexRGB = function(channel, control, red, green, blue) {
    const msg = [0xf0, 0x00, 0x02, 0x0b, 0x7f, 0x08, 0x03, 0x00, 0x05, channel, control, red, green, blue, 0xf7];
    midi.sendSysexMsg(msg, msg.length);
};

// Colour codes designed to avoid memorizing MIDI velocity values
Prime4.rgbCode = {
    black: 0,
    blueDark: 1,
    blueDim: 2,
    blue: 3,
    greenDark: 4,
    cyanDark: 5,
    greenDim: 8,
    cyanDim: 10,
    green: 12,
    cyan: 15,
    redDark: 16,
    magentaDark: 17,
    yellowDark: 20,
    whiteDark: 21,
    redDim: 32,
    magentaDim: 34,
    orangeDark: 36,
    yellowDim: 40,
    whiteDim: 42,
    red: 48,
    magenta: 51,
    orange: 56,
    yellow: 60,
    white: 63,
};

Prime4.rgbCodeSysex = {
    red: [0x7f, 0x00, 0x00],
    green: [0x00, 0x7f, 0x00],
    blue: [0x00, 0x00, 0x7f],
    yellow: [0x7f, 0x7f, 0x00],
    magenta: [0x7f, 0x00, 0x7f],
    cyan: [0x00, 0x7f, 0x7f],
    orange: [0x7f, 0x2f, 0x00],
    aqua: [0x00, 0x7f, 0x2f],
    violet: [0x2f, 0x00, 0x7f],
    white: [0x7e, 0x7e, 0x7f],
    redDark: [0x1f, 0x00, 0x00],
    greenDark: [0x00, 0x1f, 0x00],
    blueDark: [0x00, 0x00, 0x1f],
    yellowDark: [0x1f, 0x1f, 0x00],
    magentaDark: [0x1f, 0x00, 0x1f],
    cyanDark: [0x00, 0x1f, 0x1f],
    orangeDark: [0x1f, 0x0c, 0x00],
    aquaDark: [0x00, 0x1f, 0x0c],
    violetDark: [0x0c, 0x00, 0x1f],
    whiteDark: [0x1e, 0x1e, 0x1f],
};

// Used in Swiftb0y's NS6II mapping for tempo fader LEDs
Prime4.physicalSliderPositions = {
    left: 0.5,
    right: 0.5,
};

// Set active values for user-defined deck colours
const colDeck = [
    Prime4.rgbCode[deckColors[0]],
    Prime4.rgbCode[deckColors[1]],
    Prime4.rgbCode[deckColors[2]],
    Prime4.rgbCode[deckColors[3]],
];

const colDeckSysex = [
    Prime4.rgbCodeSysex[deckColors[0]],
    Prime4.rgbCodeSysex[deckColors[1]],
    Prime4.rgbCodeSysex[deckColors[2]],
    Prime4.rgbCodeSysex[deckColors[3]],
];

// Set inactive values for user-defined deck colours
const colDeckDark = [
    Prime4.rgbCode[deckColors[0] + "Dark"],
    Prime4.rgbCode[deckColors[1] + "Dark"],
    Prime4.rgbCode[deckColors[2] + "Dark"],
    Prime4.rgbCode[deckColors[3] + "Dark"],
];

const colDeckDarkSysex = [
    Prime4.rgbCodeSysex[deckColors[0] + "Dark"],
    Prime4.rgbCodeSysex[deckColors[1] + "Dark"],
    Prime4.rgbCodeSysex[deckColors[2] + "Dark"],
    Prime4.rgbCodeSysex[deckColors[3] + "Dark"],
];

// Register '0x9n' as a button press and 'ox8n' as a button release
components.Button.prototype.isPress = function(channel, control, value, status) {
    return (status & 0xF0) === 0x90;
};

Prime4.DeckAssignButton = function(options) {
    components.Button.call(this, options);

    if (!Number.isInteger(this.deckIndex)) {
        throw `invalid deckIndex: ${this.deckIndex}`;
    }
    if (!(this.toDeck instanceof Prime4.Deck)) {
        throw "invalid toDeck";
    }

    const deckSide = (this.deckIndex % 2) === 0 ? "leftDeck" : "rightDeck";
    if (!(Prime4[deckSide] instanceof Prime4.Deck)) {
        throw "invalid deckIndex or structure; We expect Prime4.leftDeck and Prime4.rightDeck to be valid decks representing the physical left and right decks";
    }
    const isActive = () => {
        return Prime4[deckSide] === this.toDeck;
    };

    this.output = function() {
        if (this.toDeck < 2) {
            sendSysexRGB(0x0F, 0x1C + this.deckIndex, ...this.on);
        } else {
            sendSysexRGB(0x0F, 0x1C + this.deckIndex, ...this.off);
        }
    };

    this.trigger = function() {
        this.output(isActive());
    };

    this.input = function(channel, control, value, status, _group) {
        if (!this.isPress(channel, control, value, status) || isActive()) {
            return;
        }
        Prime4[deckSide].forEachComponent(c => { c.disconnect(); });
        Prime4[deckSide] = this.toDeck;
        this.assignmentButtons.forEachComponent(btn => btn.trigger());
        Prime4[deckSide].forEachComponent(c => { c.connect(); c.trigger(); });
    };
};
Prime4.DeckAssignButton.prototype = Object.create(components.Button.prototype);

// References array of rate ranges
// See NS6II mapping
Prime4.CyclingArrayView = class {
    constructor(indexable, startIndex) {
        this.indexable = indexable;
        this.index = startIndex || 0;
    }
    advanceBy(n) {
        this.index = script.posMod(this.index + n, this.indexable.length);
        return this.current();
    }
    next() {
        return this.advanceBy(1);
    }
    previous() {
        return this.advanceBy(-1);
    }
    current() {
        return this.indexable[this.index];
    }
};

// Re-interpret incoming MIDI messages from the Prime 4's effect unit knobs
Prime4.EffectUnitEncoderInput = function(_channel, _control, value, _status, _group) {
    const signedValue = value > (0x80 / 2) ? value - 128 : value;
    this.inSetParameter(this.inGetParameter() + (signedValue / 100));
};

const initialPrime4Sysex = [0xf0, 0x00, 0x02, 0x0b, 0x7f, 0x08, 0x60, 0x00, 0x04, 0x04, 0x01, 0x02, 0x00, 0xf7];

Prime4.init = function(_id, _debug) {
    // Turn off all LEDs
    midi.sendShortMsg(0x90, 0x75, 0x00);

    // Return position of all components
    midi.sendSysexMsg(initialPrime4Sysex, initialPrime4Sysex.length);

    const decks = [
        new Prime4.Deck(1, 4),
        new Prime4.Deck(2, 5),
        new Prime4.Deck(3, 4),
        new Prime4.Deck(4, 5),
    ];

    // Disconnect all decks at first so they don't fight with each other
    decks.forEach(deck => deck.forEachComponent(comp => { console.log(`disconnecting "${comp.group}, ${comp.inKey}"`); comp.disconnect(); }));

    // Assign each console deck to Mixxx decks 1 and 2 on startup
    Prime4.leftDeck = decks[0];
    Prime4.rightDeck = decks[1];

    // Initialize deck toggle buttons
    Prime4.assignmentButtons = new components.ComponentContainer();
    for (let i = 0; i < decks.length; i++) {
        Prime4.assignmentButtons[i] = new Prime4.DeckAssignButton({
            midi: [0x9F, 0x1C + i],
            deckIndex: i,
            toDeck: decks[i],
            assignmentButtons: this.assignmentButtons,
            off: colDeckDarkSysex[i],
            on: colDeckSysex[i],
        });
        Prime4.assignmentButtons[i].trigger();
    }

    // Initialize mixer channel strips
    Prime4.mixerA = new mixerStrip(1, 0);
    Prime4.mixerB = new mixerStrip(2, 1);
    Prime4.mixerC = new mixerStrip(3, 2);
    Prime4.mixerD = new mixerStrip(4, 3);

    // Initialize effect banks
    Prime4.effectBank = [];
    for (let i = 0; i <= 1; i++) {
        Prime4.effectBank[i] = new components.EffectUnit([i + 1, i + 3]);
        for (let j = 0; j < 3; j++) {
            Prime4.effectBank[i].enableButtons[j + 1].midi = [0x96 + i, 0x06 + j];
            Prime4.effectBank[i].knobs[j + 1].midi = [0xB6 + i, 0x01 + j];
            Prime4.effectBank[i].knobs[j + 1].input = Prime4.EffectUnitEncoderInput;
        }
        Prime4.effectBank[i].dryWetKnob.midi = [0xB6 + i, 0x04];
        Prime4.effectBank[i].dryWetKnob.input = Prime4.EffectUnitEncoderInput;
        Prime4.effectBank[i].effectFocusButton.midi = [0x96 + i, 0x0A];
        Prime4.effectBank[i].init();
    }

    // Press down on the library encoder, acts as 'Enter' key in Mixxx library
    Prime4.encoderLoad = new components.Button({
        midi: [0x9F, 0x06],
        group: "[Library]",
        key: "GoToItem",
    });

    // VIEW Button
    Prime4.maxView = new components.Button({
        midi: [0x9F, 0x07],
        group: "[Master]",
        key: "maximize_library",
        type: components.Button.prototype.types.toggle,
    });

    // BACK Button
    Prime4.moveBack = new components.Button({
        midi: [0x9F, 0x03],
        group: "[Library]",
        key: "MoveFocusBackward",
    });

    // FWD Button
    Prime4.moveForward = new components.Button({
        midi: [0x9F, 0x04],
        group: "[Library]",
        key: "MoveFocusForward",
    });

    // Sweep FX - Filter Button
    Prime4.sweepFilter = new components.Button({
        midi: [0x9F, 0x0C],
        group: "[QuickEffectRack1_[Channel1]]",
        key: "enabled",
        on: 0x02,
        off: 0x01,
        input: function(_channel, _control, value, _status, _group) {
            for (let i = 1; i <= 4; i++) {
                if (value > 0) {
                    const effect = "[QuickEffectRack1_[Channel" + i + "]]";
                    if (engine.getParameter(effect, "enabled") > 0) {
                        engine.setParameter(effect, "enabled", 0);
                    } else {
                        engine.setParameter(effect, "enabled", 1);
                    }
                }
            }
        },
    });

    // TODO: Implement selection of specific QuickEffect preset for all 4 decks

    // Sweep FX - Echo Button
    Prime4.sweepEcho = new components.Button({
        midi: [0x9F, 0x0D],
    });
    // Sweep FX - Wash Button
    Prime4.sweepWash = new components.Button({
        midi: [0x9F, 0x0E],
    });
    // Sweep FX - Noise Button
    Prime4.sweepNoise = new components.Button({
        midi: [0x9F, 0x0F],
    });

    // Headphone Split Button
    Prime4.split = new components.Button({
        midi: [0x9F, 0x0B],
        group: "[Master]",
        key: "headSplit",
        type: components.Button.prototype.types.toggle,
    });

    Prime4.leftDeck.reconnectComponents();
    Prime4.rightDeck.reconnectComponents();

    // LED Initialization
    midi.sendShortMsg(0x94, 0x1C, 1); // Left Shift Button
    midi.sendShortMsg(0x95, 0x1C, 1); // Right Shift Button
};

Prime4.shutdown = function() {
    // Return all LEDs to initial dim state
    midi.sendShortMsg(0x90, 0x75, 0x01);
};

// All components contained in each mixer strip
const mixerStrip = function(deckNumber, midiOffset) {
    components.Deck.call(this, deckNumber);

    // FX Assign Buttons
    this.fxBankSelect = new components.ComponentContainer;
    for (let u = 1; u <= 2; u++) {
        this.fxBankSelect[u] = new components.EffectAssignmentButton({
            midi: [0x90 + midiOffset, 0x00 + u],
            effectUnit: u,
            group: "[Channel" + deckNumber + "]",
        });
    }

    // Gain Knob
    this.gain = new components.Pot({
        midi: [0xB0 + midiOffset, 0x03],
        group: "[Channel" + deckNumber + "]",
        inKey: "pregain",
    });

    // High EQ Knob
    this.eqHigh = new components.Pot({
        midi: [0xB0 + midiOffset, 0x04],
        group: "[EqualizerRack1_[Channel" + deckNumber + "]_Effect1]",
        inKey: "parameter3",
    });

    // Mid EQ Knob
    this.eqMid = new components.Pot({
        midi: [0xB0 + midiOffset, 0x06],
        group: "[EqualizerRack1_[Channel" + deckNumber + "]_Effect1]",
        inKey: "parameter2",
    });

    // Low EQ Knob
    this.eqLow = new components.Pot({
        midi: [0xB0 + midiOffset, 0x08],
        group: "[EqualizerRack1_[Channel" + deckNumber + "]_Effect1]",
        inKey: "parameter1",
    });

    // VU Meters
    this.vuMeter = new components.Component({
        midi: [0xB0 + midiOffset, 0x0A],
        group: "[Channel" + deckNumber + "]",
        outKey: "VuMeter",
        output: function(value, group) {
            if (engine.getValue(group, "PeakIndicator") === 1) {
                value = 0x7f;
            } else {
                const meter = Math.round(value * 127);
                value = (meter - ((meter - 1) % 13));
                if (value === 1) {
                    value = 0;
                }
            }
            this.send(value);
        },
    });

    //TODO: QuickEffect Knob

    // PFL Button
    this.headphoneCue = new components.Button({
        midi: [0x90 + midiOffset, 0x0D],
        key: "pfl",
        on: colDeckSysex[midiOffset],
        off: colDeckDarkSysex[midiOffset],
        type: components.Button.prototype.types.toggle,
        output: function() {
            if (engine.getValue(this.group, this.key) > 0) {
                sendSysexRGB(midiOffset, 0x0D, ...this.on);
            } else {
                sendSysexRGB(midiOffset, 0x0D, ...this.off);
            }
        },
    });

    //TODO: Volume Fader

    // Crossfader Assign Switch
    this.xFaderSwitch = new components.Button({
        midi: [0x90 + midiOffset, 0x0F],
        inKey: "orientation",
        input: function(_channel, _control, value, _status, _group) {
            this.inSetValue(value);
        },
    });

    this.reconnectComponents(function(c) {
        if (c.group === undefined) {
            c.group = this.currentDeck;
        }
    });
};

mixerStrip.prototype = new components.Deck();

// All components contained on each deck
Prime4.Deck = function(deckNumbers, midiChannel) {
    components.Deck.call(this, deckNumbers);
    const theDeck = this;

    // Used in Swiftb0y's NS6II mapping for tempo fader LEDs
    const makeSliderPosAccessors = function() {
        const lr = midiChannel % 2 === 0 ? "left" : "right";
        return {
            setter: function(pos) {
                Prime4.physicalSliderPositions[lr] = pos;
            },
            getter: function() {
                return Prime4.physicalSliderPositions[lr];
            }
        };
    };
    const sliderPosAccessors = makeSliderPosAccessors();

    // Censor Button
    this.censorButton = new components.Button({
        midi: [0x90 + midiChannel, 0x01],
        unshift: function() {
            this.inKey = "reverseroll";
            this.outKey = this.inKey;
        },
        shift: function() {
            this.inKey = "reverse";
            this.outKey = this.inKey;
        },
    });

    // Skip Backward
    this.skipBackButton = new components.Button({
        midi: [0x90 + midiChannel, 0x04],
        key: trackSkipMode[0],
    });

    // Skip Forward
    this.skipFwdButton = new components.Button({
        midi: [0x90 + midiChannel, 0x05],
        key: trackSkipMode[1],
    });

    // Beatjump Buttons
    const currentJumpSize = new Prime4.CyclingArrayView(jumpSizes, 2);
    this.bjumpBackButton = new components.Button({
        midi: [0x90 + midiChannel, 0x06],
        unshift: function() {
            this.inKey = "beatjump_backward";
            this.outKey = this.inKey;
            this.input = components.Button.prototype.input;
            this.outTrigger = true;
            this.outConnect = true;
        },
        shift: function() {
            this.inKey = "beatjump_size";
            this.outKey = this.inKey;
            this.input = function(channel, control, value, status, group) {
                if (this.isPress(channel, control, value, status, group)) {
                    this.inSetValue(currentJumpSize.previous());
                }
                this.send(value / 2 + 0.5); // Hacky way to get LEDs to respond properly
            };
            this.outTrigger = false;
            this.outConnect = false;
        },
    });
    this.bjumpFwdButton = new components.Button({
        midi: [0x90 + midiChannel, 0x07],
        unshift: function() {
            this.inKey = "beatjump_forward";
            this.outKey = this.inKey;
            this.input = components.Button.prototype.input;
            this.outTrigger = true;
            this.outConnect = true;
        },
        shift: function() {
            this.inKey = "beatjump_size";
            this.outKey = this.inKey;
            this.input = function(channel, control, value, status, group) {
                if (this.isPress(channel, control, value, status, group)) {
                    this.inSetValue(currentJumpSize.next());
                }
                this.send(value / 2 + 0.5); // Hacky way to get LEDs to respond properly
            };
            this.outTrigger = false;
            this.outConnect = false;
        },
    });

    // Sync Button
    this.syncButton = new components.SyncButton({
        midi: [0x90 + midiChannel, 0x08],
    });

    // Cue Button
    this.cueButton = new components.CueButton({
        midi: [0x90 + midiChannel, 0x09],
    });

    // Play Button
    this.playButton = new components.PlayButton({
        midi: [0x90 + midiChannel, 0x0A],
        unshift: function() {
            components.PlayButton.prototype.unshift.call(this);
            this.type = components.Button.prototype.types.toggle;
        },
        shift: function() {
            this.inKey = "play_stutter";
            this.type = components.Button.prototype.types.push;
        }
    });

    // Performance Pads
    this.padGrid = new Prime4.PadSection(this, midiChannel - 4);

    //this.gridEditMode = true;

    // Beatgrid edit mode
    this.gridEditButton = new components.Button({
        midi: [0x90 + midiChannel, 0x1B],
        key: "show_beatgrid_controls",
        group: "[Skin]",
        type: components.Button.prototype.types.toggle,
    });

    // Beatgrid shift buttons
    this.gridShiftLeft = new components.Button({
        midi: [0x90 + midiChannel, 0x19],
        key: "beats_translate_earlier",
    });
    this.gridShiftRight = new components.Button({
        midi: [0x90 + midiChannel, 0x1A],
        key: "beats_translate_later",
    });

    // Pitch Bend Buttons
    const currentRateRange = new Prime4.CyclingArrayView(rateRanges, 2);
    this.pitchBendUp = new components.Button({
        midi: [0x90 + midiChannel, 0x1E],
        type: components.Button.prototype.types.push,
        unshift: function() {
            this.inKey = "rate_temp_up";
            this.outKey = this.inKey;
            this.input = components.Button.prototype.input;
            this.outTrigger = true;
            this.outConnect = true;
        },
        shift: function() {
            this.inKey = "rateRange";
            this.outKey = this.inKey;
            this.input = function(channel, control, value, status, group) {
                if (this.isPress(channel, control, value, status, group)) {
                    this.inSetValue(currentRateRange.next());
                }
                this.send(value / 2 + 0.5); // Hacky way to get LEDs to respond properly
            };
            console.log("Sifted");
            this.outTrigger = false;
            this.outConnect = false;
        },
    });
    this.pitchBendDown = new components.Button({
        midi: [0x90 + midiChannel, 0x1D],
        type: components.Button.prototype.types.push,
        unshift: function() {
            this.inKey = "rate_temp_down";
            this.outKey = this.inKey;
            this.input = components.Button.prototype.input;
            this.outTrigger = true;
            this.outConnect = true;
        },
        shift: function() {
            this.inKey = "rateRange";
            this.outKey = this.inKey;
            this.input = function(channel, control, value, status, group) {
                if (this.isPress(channel, control, value, status, group)) {
                    this.inSetValue(currentRateRange.previous());
                }
                this.send(value / 2 + 0.5); // Hacky way to get LEDs to respond properly
            };
            console.log("Shifted");
            this.outTrigger = false;
            this.outConnect = false;
        },
    });

    // Tempo Fader
    this.tempoFader = new components.Pot({
        midi: [0xB0 + midiChannel, 0x1F],
        inKey: "rate",
        invert: true,
        inSetParameter: function(value) {
            sliderPosAccessors.setter(value);
            engine.setParameter(this.group, this.inKey, value);
            theDeck.takeoverLeds.trigger();
        },
    });

    const takeoverLEDValues = {
        OFF: 0,
        DIMM: 1,
        FULL: 2,
    };
    const takeoverLEDControls = {
        up: 0x35,
        center: 0x34,
        down: 0x33,
    };

    this.takeoverLeds = new components.Component({
        midi: [0x90 + midiChannel, takeoverLEDControls.center],
        outKey: "rate",
        off: 0,
        output: function(softwareSliderPosition) {
            // rate slider centered?
            this.send(softwareSliderPosition === 0 ? takeoverLEDValues.FULL : takeoverLEDValues.OFF);

            const distance2Brightness = function(distance) {
                // src/controllers/softtakeover.cpp
                // SoftTakeover::kDefaultTakeoverThreshold = 3.0 / 128;
                const takeoverThreshold = 3 / 128;
                if (distance > takeoverThreshold && distance < 0.10) {
                    return takeoverLEDValues.DIMM;
                } else if (distance >= 0.10) {
                    return takeoverLEDValues.FULL;
                } else {
                    return takeoverLEDValues.OFF;
                }
            };

            const normalizedPhysicalSliderPosition = sliderPosAccessors.getter()*2 - 1;
            const distance = Math.abs(normalizedPhysicalSliderPosition - softwareSliderPosition);
            const directionLedBrightness = distance2Brightness(distance);

            if (normalizedPhysicalSliderPosition > softwareSliderPosition) {
                midi.sendShortMsg(this.midi[0], takeoverLEDControls.up, takeoverLEDValues.OFF);
                midi.sendShortMsg(this.midi[0], takeoverLEDControls.down, directionLedBrightness);
            } else {
                midi.sendShortMsg(this.midi[0], takeoverLEDControls.down, takeoverLEDValues.OFF);
                midi.sendShortMsg(this.midi[0], takeoverLEDControls.up, directionLedBrightness);
            }
        },
    });

    // Keylock Button
    this.keylockButton = new components.Button({
        midi: [0x90 + midiChannel, 0x22],
        key: "keylock",
        type: components.Button.prototype.types.toggle,
    });

    // Vinyl Mode Button
    this.vinylButton = new components.Button({
        midi: [0x90 + midiChannel, 0x23],
        type: components.Button.prototype.types.toggle,
        input: function(channel, control, value, status, _group) {
            if (!this.isPress(channel, control, value, status)) {
                return;
            }
            theDeck.jogWheel.vinylMode = !theDeck.jogWheel.vinylMode;
            this.trigger();
        },
        trigger: function() {
            this.output(theDeck.jogWheel.vinylMode);
        },
    });

    // Jog Wheel
    this.jogWheel = new components.JogWheelBasic({
        deck: script.deckFromGroup(this.currentDeck),
        wheelResolution: 1000,
        alpha: 1/8,
        beta: 1/8/32,
        rpm: 33 + 1/3,
        // Instead of relative movements between this and the last position,
        // the controller reports the absolute position of the wheel with
        // 14-bit precision. Because of that, we need to reconstruct the value
        // and then transform it into the relative directions expected by Mixxx.
        inputWheelMSB: function(_channel, _control, value, _status, _group) {
            this.wheelMSB = value;
        },
        inputWheelLSB: function(channel, control, value, status, group) {
            this.inputWheel(channel, control, (this.wheelMSB << 7) + value, status, group);
        },
        previousPosition: null,
        wrappingValue: Math.pow(2, 14),
        relativeFromAbsolute: function(value) {
            // The first value of the controller will probably be random
            // and thus we just have to swallow it until we have the second value
            // to find the difference
            if (this.previousPosition === null) {
                this.previousPosition = value;
                return 0;
            }
            // This finds the shortest distance between the current value
            // and the last one, and preserves the orientation
            const delta = value - this.previousPosition;
            let remainder = ((delta % this.wrappingValue) + this.wrappingValue) % this.wrappingValue;
            //let remainder = script.posMod(delta, this.wrappingValue);
            if (remainder * 2 > this.wrappingValue) {
                remainder -= this.wrappingValue;
            }
            this.previousPosition = value;
            return remainder;
        },
        jogScale: function(val) {
            // wheelSensitivity is user-configurable, see top of file.
            return val * wheelSensitivity;
        },
        inputWheel: function(channel, control, value, _status, _group) {
            value = this.relativeFromAbsolute(value);
            if (engine.isScratching(this.deck)) {
                engine.scratchTick(this.deck, value);
            } else {
                this.inSetValue(this.jogScale(value));
            }
        },
    });

    // Jog Wheel LED
    this.jogWheelLed = new components.Component({
        midi: [0x90 + midiChannel, 0x21],
        outKey: "scratch2_enable",
        on: [0x7f, 0x7f, 0x7f],
        off: colDeckSysex[deckNumbers - 1],
        output: function(value) {
            if (value > 0) {
                sendSysexRGB(midiChannel, 0x21, ...this.on);
            } else {
                sendSysexRGB(midiChannel, 0x21, ...this.off);
            }
        },
        trigger: function() {
            sendSysexRGB(midiChannel, 0x21, ...this.off);
        },
    });

    // Slip Mode Button
    this.slipButton = new components.Button({
        midi: [0x90 + midiChannel, 0x24],
        key: "slip_enabled",
        type: components.Button.prototype.types.toggle,
    });

    // Loop In Button
    this.loopInButton = new components.Button({
        midi: [0x90 + midiChannel, 0x25],
        key: "loop_in",
    });

    // Loop Out Button
    this.loopOutButton = new components.Button({
        midi: [0x90 + midiChannel, 0x26],
        key: "loop_out",
    });

    // Load Buttons
    this.deckLoad = new components.Button({
        midi: [0x9F, midiChannel - 3],
        key: "LoadSelectedTrack",
        off: colDeckDark[deckNumbers - 1],
        on: colDeck[deckNumbers - 1],
        shift: function() {
            this.inKey = "eject";
            this.outKey = this.inKey;
            this.off = Prime4.rgbCodeSysex.whiteDark;
            this.on = Prime4.rgbCodeSysex.white;
        },
        unshift: function() {
            this.inKey = "LoadSelectedTrack";
            this.outKey = this.inKey;
            this.off = colDeckDarkSysex[deckNumbers - 1];
            this.on = colDeckSysex[deckNumbers - 1];
        },
        output: function(value) {
            if (value > 0) {
                sendSysexRGB(0x0F, midiChannel - 3, ...this.on);
            } else {
                sendSysexRGB(0x0F, midiChannel - 3, ...this.off);
            }
        },
    });

    this.reconnectComponents(function(c) {
        if (c.group === undefined) {
            c.group = this.currentDeck;
        }
    });

};

Prime4.Deck.prototype = new components.Deck();

Prime4.shift = false;
Prime4.shiftState = function(channel, control, value) {
    Prime4.shift = value === 0x7F;
    if (Prime4.shift) {
        midi.sendShortMsg(0x90 + channel, control, 0x02);
        Prime4.leftDeck.shift();
        Prime4.rightDeck.shift();
        Prime4.effectBank[0].shift();
        Prime4.effectBank[1].shift();
        Prime4.leftDeck.reconnectComponents();
        Prime4.rightDeck.reconnectComponents();
    } else {
        midi.sendShortMsg(0x90 + channel, control, 0x01);
        Prime4.leftDeck.unshift();
        Prime4.rightDeck.unshift();
        Prime4.effectBank[0].unshift();
        Prime4.effectBank[1].unshift();
        Prime4.leftDeck.reconnectComponents();
        Prime4.rightDeck.reconnectComponents();
    }
};

//========== PERFORMANCE PADS ==========//

// Access the appropriate mode-select pad without remembering MIDI values
Prime4.padMode = {
    HOTCUE: 0x0B,
    LOOP: 0x0C,
    ROLL: 0x0D,
    SLICER: 0x0E,
};

Prime4.PadSection = function(deck, offset) {
    components.ComponentContainer.call(this);
    const theContainer = this;

    // Create component containers for each pad mode
    const modes = new components.ComponentContainer({
        "hotcue": new Prime4.CyclingArrayView([new Prime4.hotcueMode(deck, offset)], 0),
        "loop": new Prime4.CyclingArrayView([new Prime4.savedLoopMode(deck, offset), new Prime4.autoloopMode(deck, offset)], 0),
        "roll": new Prime4.CyclingArrayView([new Prime4.rollMode(deck, offset)], 0),
        "slicer": new Prime4.CyclingArrayView([new Prime4.extraCueModeA(deck, offset), new Prime4.extraCueModeB(deck, offset)], 0),
        "rollShift": new Prime4.CyclingArrayView([new Prime4.samplerMode(deck, offset)], 0),
    });

    modes.forEachComponent(c => c.disconnect());

    const controlToPadMode = control => {
        // If a pad selector button has multiple modes, go to the first mode
        // by default. Otherwise, go to the next mode in that button's list.
        const nextPadMode = (a) => {
            console.log(a);
            if (a.indexable.includes(this.currentMode)) {
                return a.next();
            } else {
                a.index = 0;
                return a.current();
            }
        };

        let mode;

        switch (control) {
        case Prime4.padMode.HOTCUE:
            mode = nextPadMode(modes.hotcue);
            break;
        case Prime4.padMode.LOOP:
            mode = nextPadMode(modes.loop);
            break;
        case Prime4.padMode.ROLL:
            if (Prime4.shift) {
                mode = nextPadMode(modes.rollShift);
            } else {
                mode = nextPadMode(modes.roll);
            }
            break;
        case Prime4.padMode.SLICER:
            mode = nextPadMode(modes.slicer);
            break;
        }

        return mode;
    };

    this.offset = offset;

    this.padModeSelectLeds = new components.Component({
        trigger: function() {
            /*
             * This function results in the currently selected pad mode showing
             * an inactive state when selecting pad modes with the shift button
             *
            for (const modeLayers of Object.values(modes)) {
                const mode = modeLayers.current();
                midi.sendShortMsg(0x94 + offset, mode.ledControl, theContainer.currentMode === mode ? mode.colourOn : mode.colourOff);
            }
            */
            for (const modeLayers of Object.values(modes)) {
                const mode = modeLayers.current();
                if (theContainer.currentMode !== mode) {
                    midi.sendShortMsg(0x94 + offset, mode.ledControl, mode.colourOff);
                }
            }
            for (const modeLayers of Object.values(modes)) {
                const mode = modeLayers.current();
                if (theContainer.currentMode === mode) {
                    midi.sendShortMsg(0x94 + offset, mode.ledControl, mode.colourOn);
                }
            }
        },
    }, false);

    // Function for switching between pad modes
    this.setPadMode = function(control) {
        const newMode = controlToPadMode(control);

        // Exit early if requested mode is already active or unavailable
        if (newMode === this.currentMode || newMode === undefined) {
            return;
        }

        // Disable LED of current mode button
        if (this.currentMode) {
            // Disconnect pads from current mode
            this.currentMode.forEachComponent(function(component) {
                component.disconnect();
                component.outConnect = false;
            });
        }

        // Connect pads to new mode
        newMode.forEachComponent(function(component) {
            component.outConnect = true;
            component.connect();
            component.trigger();
        });

        // Assign mode select buttons in XML file
        this.padModeButtonPressed = function(channel, control, value, _status, _group) {
            if (value) {
                this.setPadMode(control);
            }
        };

        this.currentMode = newMode;
        console.log(this.currentMode);

        theContainer.padModeSelectLeds.trigger();
    };

    // Start in Hotcue mode
    this.setPadMode(Prime4.padMode.HOTCUE);

};

Prime4.PadSection.prototype = Object.create(components.ComponentContainer.prototype);

// Worry about parameter buttons later
//Prime4.PadSection.prototype.paramButtonPressed = function(channel, control, value, status, group) {};

// Assign pads mapped in XML file
Prime4.PadSection.prototype.performancePad = function(channel, control, value, status, group) {
    const i = (control - 0x0E);
    this.currentMode.pads[i].input(channel, control, value, status, group);
};

// HOTCUE MODE
Prime4.hotcueMode = function(deck, offset) {
    components.ComponentContainer.call(this);
    this.ledControl = Prime4.padMode.HOTCUE;
    this.colourOn = Prime4.rgbCode.blue;
    this.colourOff = Prime4.rgbCode.whiteDark;
    this.pads = new components.ComponentContainer();
    for (let i = 1; i <= 8; i++) {
        this.pads[i] = new components.HotcueButton({
            number: i,
            group: deck.currentDeck,
            midi: [0x94 + offset, 0x0E + i],
            sendRGB: function(color_obj) {
                const msg = [0xf0, 0x00, 0x02, 0x0b, 0x7f, 0x08, 0x03, 0x00, 0x05, 0x04 + offset, 0x0E + i, color_obj.red>>1, color_obj.green>>1, color_obj.blue>>1, 0xf7];
                midi.sendSysexMsg(msg, msg.length);
            },
            on: this.colourOn,
            off: this.colourOff,
            outConnect: false,
        });
    }
};
Prime4.hotcueMode.prototype = Object.create(components.ComponentContainer.prototype);

// SAVED LOOP MODE
Prime4.savedLoopMode = function(deck, offset) {
    components.ComponentContainer.call(this);
    this.ledControl = Prime4.padMode.LOOP;
    this.colourOn = Prime4.rgbCode.blue;
    this.colourOff = Prime4.rgbCode.whiteDark;
    this.pads = new components.ComponentContainer();
    for (let i = 1; i <= 8; i++) {
        this.pads[i] = new components.HotcueButton({
            number: i + 8,
            group: deck.currentDeck,
            midi: [0x94 + offset, 0x0E + i],
            sendRGB: function(color_obj) {
                const msg = [0xf0, 0x00, 0x02, 0x0b, 0x7f, 0x08, 0x03, 0x00, 0x05, 0x04 + offset, 0x0E + i, color_obj.red>>1, color_obj.green>>1, color_obj.blue>>1, 0xf7];
                midi.sendSysexMsg(msg, msg.length);
            },
            on: this.colourOn,
            off: this.colourOff,
            outConnect: false,
        });
    }
};
Prime4.savedLoopMode.prototype = Object.create(components.ComponentContainer.prototype);

// AUTOLOOP MODE
Prime4.autoloopMode = function(deck, offset) {
    components.ComponentContainer.call(this);
    this.ledControl = Prime4.padMode.LOOP;
    this.colourOn = Prime4.rgbCode.green;
    this.colourOff = Prime4.rgbCode.whiteDark;
    this.pads = new components.ComponentContainer();
    this.loopSize = [0.0625, 0.125, 0.25, 0.5, 1, 2, 4, 8];
    for (let i = 1; i <= 8; i++) {
        const loopSize = (this.loopSize[i - 1]);
        this.pads[i] = new components.Button({
            midi: [0x94 + offset, 0x0E + i],
            group: deck.currentDeck,
            outKey: "beatloop_" + loopSize + "_enabled",
            inKey: "beatloop_" + loopSize + "_toggle",
            on: Prime4.rgbCode.white,
            off: Prime4.rgbCode.greenDark,
            outConnect: false,
        });
    }
};
Prime4.autoloopMode.prototype = Object.create(components.ComponentContainer.prototype);

// ROLL MODE
Prime4.rollMode = function(deck, offset) {
    components.ComponentContainer.call(this);
    this.ledControl = Prime4.padMode.ROLL;
    this.colourOn = Prime4.rgbCode.blue;
    this.colourOff = Prime4.rgbCode.whiteDark;
    this.pads = new components.ComponentContainer();
    // NOTE: The Prime 4's standalone Roll mode includes triplet loop rolls, but
    //       Mixxx doesn't support those yet.
    this.rollSize = [0.0625, 0.125, 0.25, 0.5, 1, 2, 4, 8];
    for (let i = 1; i <= 8; i++) {
        const rollSize = (this.rollSize[i - 1]);
        this.pads[i] = new components.Button({
            midi: [0x94 + offset, 0x0E + i],
            group: deck.currentDeck,
            outKey: "beatloop_" + rollSize + "_enabled",
            inKey: "beatlooproll_" + rollSize + "_activate",
            on: Prime4.rgbCode.white,
            off: Prime4.rgbCode.green,
            outConnect: false,
        });
        if (i % 2 === 0 & i < 8) {
            this.pads[i].off = 0x23;
        }
    }
};
Prime4.rollMode.prototype = Object.create(components.ComponentContainer.prototype);

// SAMPLER MODE
Prime4.samplerMode = function(deck, offset) {
    components.ComponentContainer.call(this);
    this.ledControl = Prime4.padMode.ROLL;
    this.colourOn = Prime4.rgbCode.green;
    this.colourOff = Prime4.rgbCode.whiteDark;
    this.pads = new components.ComponentContainer();
    for (let i = 1; i <= 8; i++) {
        this.pads[i] = new components.SamplerButton({
            number: i,
            midi: [0x94 + offset, 0x0E + i],
            on: Prime4.rgbCode.orange,
            off: Prime4.rgbCode.orangeDark,
            outConnect: false,
        });
    }
};
Prime4.samplerMode.prototype = Object.create(components.ComponentContainer.prototype);

/*
 * TODO: Add slicer mode
 *
 * Thanks to the new controls added in 2.4, I believe I can create a custom
 * pad mode that behaves just like Slicer Mode in the Prime 4's standalone
 * mode. It would involve setting 8 hotcues across the next 8 beats on the
 * beatgrid, then clearing and re-setting those hotcues every 8 beats.
 * Slicer Loop mode could work in a similar way, but instead of re-setting
 * the hotcues every 8 beats, I just set the 8 hotcues once, then make an
 * 8-beat loop starting from the first new hotcue, and activate a 1-beat
 * loop roll whenever one of the hotcue pads get pressed. I need to
 * familiarize myself with these new Mixxx Controls first, but I'm pretty
 * sure it's possible. Hopefully this can then be implemented in
 * ComponentsJS so that it can easily be added to other hardware in the
 * future.
 *
 * For now, I'll just make the Slicer pad mode control hotcues 17 to 24,
 * like how Loop mode controls hotcues 9 to 16 for the time-being.
 */

Prime4.extraCueModeA = function(deck, offset) {
    components.ComponentContainer.call(this);
    this.ledControl = Prime4.padMode.SLICER;
    this.colourOn = Prime4.rgbCode.blue;
    this.colourOff = Prime4.rgbCode.whiteDark;
    this.pads = new components.ComponentContainer();
    for (let i = 1; i <= 8; i++) {
        this.pads[i] = new components.HotcueButton({
            number: i + 16,
            group: deck.currentDeck,
            midi: [0x94 + offset, 0x0E + i],
            on: this.colourOn,
            off: this.colourOff,
            outConnect: false,
        });
    }
};
Prime4.extraCueModeA.prototype = Object.create(components.ComponentContainer.prototype);

Prime4.extraCueModeB = function(deck, offset) {
    components.ComponentContainer.call(this);
    this.ledControl = Prime4.padMode.SLICER;
    this.colourOn = Prime4.rgbCode.green;
    this.colourOff = Prime4.rgbCode.whiteDark;
    this.pads = new components.ComponentContainer();
    for (let i = 1; i <= 8; i++) {
        this.pads[i] = new components.HotcueButton({
            number: i + 24,
            group: deck.currentDeck,
            midi: [0x94 + offset, 0x0E + i],
            on: this.colourOn,
            off: this.colourOff,
            outConnect: false,
        });
    }
};
Prime4.extraCueModeB.prototype = Object.create(components.ComponentContainer.prototype);
