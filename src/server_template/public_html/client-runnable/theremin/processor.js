const LOW_FREQ = 440.0;
const HIGH_FREQ = 880.0;
const START_FREQ = 440.0;
const LOW_AMP = 0.01;
const HIGH_AMP = 1.0;
const START_AMP = 0.000001;
const WINDOW_DURATION_S = 0.04;

const LOW_HERTOCTS = Math.log2(LOW_FREQ);
const RANGE_HERTOCTS = Math.log2(HIGH_FREQ) - LOW_HERTOCTS;
const START_HERTOCTS = Math.log2(START_FREQ);
const LOW_BIELS = Math.log2(LOW_AMP);
const RANGE_BIELS = Math.log2(HIGH_AMP) - LOW_BIELS;
const START_BIELS = Math.log2(START_AMP);

const PI = Math.PI;
const TAU = PI * 2;

const BLOCK_SIZE = 128;
const BLOCK_RATE = sampleRate / BLOCK_SIZE;
const SAMPLE_PHASE_FOR_1HZ = TAU / sampleRate;
const BLOCK_PHASE_FOR_1HZ = TAU / BLOCK_RATE;

const SAMPLE_PHASE_FOR_WINDOW = SAMPLE_PHASE_FOR_1HZ / WINDOW_DURATION_S;
const BLOCK_PHASE_FOR_WINDOW = BLOCK_PHASE_FOR_1HZ / WINDOW_DURATION_S;

const NONZERO_WINDOW_SAMPLES = Math.ceil(WINDOW_DURATION_S * sampleRate) - 1;
const STRAY_SAMPLES = NONZERO_WINDOW_SAMPLES % BLOCK_SIZE;
const FULL_BLOCKS = Math.round((NONZERO_WINDOW_SAMPLES - STRAY_SAMPLES) / BLOCK_SIZE);
const BREAK_I = STRAY_SAMPLES
const LONG_CUMSUM_LEN = FULL_BLOCKS + 1;
const SHORT_CUMSUM_LEN = FULL_BLOCKS;
const CUMSUM_SIZE = LONG_CUMSUM_LEN + 1;


if (FULL_BLOCKS < 1) {
    throw new Error("WINDOW_DURATION_S too low")
}


class DoubleHannWindowedMovingSum {
    constructor(initialValue) {
        this.i = CUMSUM_SIZE - 1;
        this.phase = 0.0;
        this.cumsum = new Float32Array(CUMSUM_SIZE);
        this.cosCumsum = new Float32Array(CUMSUM_SIZE);
        this.sinCumsum = new Float32Array(CUMSUM_SIZE);

        this.fillInitialValues(initialValue);
    }

    update(newVal) {
        this.i = (this.i + 1) % CUMSUM_SIZE
        this.phase = (this.phase + BLOCK_PHASE_FOR_WINDOW) % TAU;

        const curr = this.i;
        this.cumsum[curr] = newVal;
        this.cosCumsum[curr] = newVal * Math.cos(this.phase);
        this.sinCumsum[curr] = newVal * Math.sin(this.phase);

        if (curr !== 0) {
            const prev = curr - 1;
            this.cumsum[curr] += this.cumsum[prev];
            this.cosCumsum[curr] += this.cosCumsum[prev];
            this.sinCumsum[curr] += this.sinCumsum[prev];
        }
    }

    fillInitialValues(initialValue) {
        for (let i = 0; i < CUMSUM_SIZE; i++) {
            this.update(initialValue);
        }
    }

    getSum(cumsumArr, cumsumLen) {
        let takeI = this.i - cumsumLen;

        if (takeI >= 0) {
            return cumsumArr[this.i] - cumsumArr[takeI];
        } else if (takeI === -1) {
            return cumsumArr[this.i];
        } else {
            takeI += CUMSUM_SIZE;
            return cumsumArr[this.i] + cumsumArr[CUMSUM_SIZE - 1] - cumsumArr[takeI];
        }
    }

    fillBuffer(startI, stopI, cumsumLen, outBuffer) {
        const startPhase = this.phase + SAMPLE_PHASE_FOR_WINDOW;

        const sum = this.getSum(this.cumsum, cumsumLen);
        const cosSum = this.getSum(this.cosCumsum, cumsumLen);
        const sinSum = this.getSum(this.sinCumsum, cumsumLen);

        let phase, rectangleMinusDoubleHannSum;
        for (let i = startI; i < stopI; i++) {
            phase = startPhase + i * SAMPLE_PHASE_FOR_WINDOW;
            rectangleMinusDoubleHannSum = cosSum * Math.cos(phase) + sinSum * Math.sin(phase);
            outBuffer[i] = sum - rectangleMinusDoubleHannSum;
        }
    }

    process(newVal, outBuffer) {
        this.update(newVal);

        this.fillBuffer(0, BREAK_I, LONG_CUMSUM_LEN, outBuffer);
        this.fillBuffer(BREAK_I, BLOCK_SIZE, SHORT_CUMSUM_LEN, outBuffer);
    }
}


class Processor extends AudioWorkletProcessor {
    constructor() {
        super();

        this.phase = 0.0;
        this.weightingMovingSum = new DoubleHannWindowedMovingSum(1.0);
        this.hertoctsMovingSum = new DoubleHannWindowedMovingSum(START_HERTOCTS);
        this.bielsMovingSum = new DoubleHannWindowedMovingSum(START_BIELS);
        this.bufferA = new Float32Array(BLOCK_SIZE);
        this.bufferB = new Float32Array(BLOCK_SIZE);
        this.bufferC = new Float32Array(BLOCK_SIZE);
    }

    static get parameterDescriptors() {
        return [
            {
                name: "xProportion",
                defaultValue: 0.0,
                minValue: 0.0,
                maxValue: 1.0,
                automationRate: "k-rate"
            },
            {
                name: "yProportion",
                defaultValue: 3.0,
                minValue: 0.0,
                maxValue: 3.0,
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
            buffer[i] = buffer[i] < PI ? 1.0 : -1.0;
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

    getReciprocalWeightings(outBuffer) {
        this.weightingMovingSum.process(1.0, outBuffer);

        for (let i = 0; i < BLOCK_SIZE; i++) {
            outBuffer[i] = 1.0 / outBuffer[i];
        }
    }

    multiply(bufferA, bufferB, outBuffer) {
        for (let i = 0; i < BLOCK_SIZE; i++) {
            outBuffer[i] = bufferA[i] * bufferB[i];
        }
    }

    getUnamplifiedWave(xProportion, reciprocalWeightings, outBuffer) {
        const hertocts = xProportion * RANGE_HERTOCTS + LOW_HERTOCTS;
        this.hertoctsMovingSum.process(hertocts, outBuffer);
        this.multiply(outBuffer, reciprocalWeightings, outBuffer);
        this.hertoctsToPhases(outBuffer);
        this.phasesToSquare(outBuffer);
    }

    getAmps(yProportion, reciprocalWeightings, outBuffer) {
        const biels = (1 - yProportion) * RANGE_BIELS + LOW_BIELS;
        this.bielsMovingSum.process(biels, outBuffer);
        this.multiply(outBuffer, reciprocalWeightings, outBuffer);
        this.bielsToAmps(outBuffer);
    }

    fillOtherChannels(srcChannel, dstChannels) {
        dstChannels.forEach(dstChannel => {
            for (let i = 0; i < BLOCK_SIZE; i++) {
                dstChannel[i] = srcChannel[i];
            }
        })
    }

    process(_inputList, outputList, parameters) {
        this.getReciprocalWeightings(this.bufferA);
        this.getUnamplifiedWave(parameters.xProportion[0], this.bufferA, this.bufferB);
        this.getAmps(parameters.yProportion[0], this.bufferA, this.bufferC);

        const firstOutput = outputList[0];
        const firstChannel = firstOutput[0];
        const otherChannels = firstOutput.slice(1);

        this.multiply(this.bufferB, this.bufferC, firstChannel);
        this.fillOtherChannels(firstChannel, otherChannels);

        return true;
    }
}


registerProcessor("processor", Processor);
