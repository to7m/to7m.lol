const LOW_FREQ = 440.0;
const HIGH_FREQ = 880.0;
const LOW_AMP = 0.01;
const HIGH_AMP = 1.0;

const TAU = Math.PI * 2;


class DoubleHannWindowedMovingSum {
    constructor(windowDuration, sampleRate, blockSize) {
        this.blockRate = sampleRate / blockSize;
        this.windowSize = windowDuration / blockRate;
        this.cumsumSize = 10000; console.log("actually calculate this");

        this.phase = 0;
    }
}


class Processor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.phase = 0.0;
        this.hertOctsMovingSum = null;
        this.bielsMovingSum = null;
        this.weightingMovingSum = null;
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

    process(_inputList, outputList, parameters) {
        const firstOutput = outputList[0];
        const firstChannel = firstOutput[0];
        const numOfSamples = firstChannel.length;

        const xProportion = parameters.xProportion[0];
        const 
        const phasePerSample = freq * tau / sampleRate;

        const yProportion = parameters.yProportion[0];

        for (let i = 0; i < numOfSamples; i++) {
            if (this.phase < Math.PI) {
                firstChannel[i] = -amp;
            } else {
                firstChannel[i] = amp;
            }

            this.phase += phasePerSample;
            this.phase %= tau;
        }

        firstOutput.slice(1).forEach(currentChannel => {
            for (let i = 0; i < numOfSamples; i++) {
                currentChannel[i] = firstChannel[i];
            }
        })

        return true;
    }
}


registerProcessor("processor", Processor);
