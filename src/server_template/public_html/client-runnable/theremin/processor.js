const LOW_FREQ = 440.0;
const HIGH_FREQ = 880.0;
const LOW_AMP = 0.01;
const HIGH_AMP = 1.0;
const WINDOW_DURATION_S = 0.3;

const LOW_HERTOCTS = Math.log2(LOW_FREQ);
const RANGE_HERTOCTS = Math.log2(HIGH_FREQ) - LOW_HERTOCTS;
const LOW_BIELS = Math.log2(LOW_AMP);
const RANGE_BIELS = Math.log2(HIGH_AMP) - LOW_BIELS;

const PI = Math.PI;
const TAU = PI * 2;
const BLOCK_SIZE = 128;
const BLOCK_RATE = sampleRate / BLOCK_SIZE;
const SAMPLE_PHASE_FOR_1HZ = TAU / sampleRate;


class DoubleHannWindowedMovingSum {
    constructor() {
        this.cumsumSize = 10000; console.log("actually calculate this");

        this.phase = 0;
    }

    process(newVal, outBuffer) {
        ...
    }
}


class Processor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.phase = 0.0;
        this.hertoctsMovingSum = new DoubleHannWindowedMovingSum;
        this.bielsMovingSum = null;
        this.weightingMovingSum = null;
        this.bufferA = new Float32Array(BLOCK_SIZE);
        this.bufferB = new Float32Array(BLOCK_SIZE);
    }

    static get parameterDescriptors() {
        return [
            {
                name: "xProportion",
                defaultValue: 0.5,
                minValue: 0.0,
                maxValue: 1.0,
                automationRate: "k-rate"
            },
            {
                name: "yProportion",
                defaultValue: 0.5,
                minValue: 0.0,
                maxValue: 1.0,
                automationRate: "k-rate"
            }
        ];
    }

    hertoctsToPhases(buffer) {
        let phase = this.phase;
        let freq;

        for (let i = 0; i < BLOCK_SIZE; i++) {
            freq = 2 ** buffer[i];
            phase += SAMPLE_PHASE_FOR_1HZ * freq;
            phase %= TAU;
            buffer[i] = phase;
        }

        this.phase = phase;
    }

    phasesToSquare(buffer) {
        for (let i = 0; i < BLOCK_SIZE; i++) {
            buffer[i] = buffer[i] < PI ? -1.0 : 1.0;
        }
    }

    bielsToAmps(buffer) {
        for (let i = 0; i < BLOCK_SIZE; i++) {
            buffer[i] = 2 ** buffer[i];
        }
    }

    multiply(bufferA, bufferB, outBuffer) {
        for (let i = 0; i < BLOCK_SIZE; i++) {
            outBuffer[i] = bufferA[i] * bufferB[i];
        }
    }

    fillOtherChannels(firstChannel, otherChannels) {
        otherChannels.forEach(currentChannel => {
            for (let i = 0; i < BLOCK_SIZE; i++) {
                currentChannel[i] = firstChannel[i];
            }
        })

    }

    process(_inputList, outputList, parameters) {
        const firstOutput = outputList[0];
        const firstChannel = firstOutput[0];
        const otherChannels = firstOutput.slice(1);

        const xProportion = parameters.xProportion[0];
        const hertocts = xProportion * RANGE_HERTOCTS + LOW_HERTOCTS;
        this.hertoctsMovingSum.process(newVal=hertocts, outBuffer=this.bufferA);
        this.hertoctsToPhases(this.bufferA);
        this.phasesToSquare(this.bufferA);

        const yProportion = parameters.yProportion[0];
        const biels = yProportion * RANGE_BIELS + LOW_BIELS;
        this.bielsMovingSum.process(newVal=biels, outBuffer=this.bufferB);
        this.bielsToAmps(this.bufferB);

        this.multiply(this.bufferA, this.bufferB, outBuffer=firstChannel);
        this.fillOtherChannels(firstChannel, otherChannels);

        return true;
    }
}


registerProcessor("processor", Processor);
