const startDelayS = 0.3;

const processingSettingsForm = document.getElementById("processing-settings-form");
const delayedChannelButton = document.getElementById("delayed-channel-button");
const channelDelaySInput = document.getElementById("channel-delay-s");
const startButton = document.getElementsByClassName("start-stop-button")[0];
const amplitudeMarkers = document.getElementById("amplitude-markers");
const amplitudeHigh = amplitudeMarkers.children[0];
const amplitudeGeneratedMarkers = amplitudeMarkers.children[1];
const amplitudeLow = amplitudeMarkers.children[2];
const analysisDirectionForm = document.getElementById("analysis-direction-form");

let stopButton = startButton.cloneNode();
stopButton.innerText = "Stop";
let stoppingButton = startButton.cloneNode();
stoppingButton.innerText = "Stopping...";
stoppingButton.disabled = true;
let startStopButton = "start";

let delayedChannelI = 1;
let channelDelayS;

let renderSettingsChanged = true;
let frequencyResponseDataChanged = true;


const renderer = {
    amplitudeHigh: null,
    amplitudeLow: null,
    frequencyLow: null,
    frequencyHigh: null,
    canvasHeight: null,
    canvasWidth: null,

    markersTopY: null,
    markersBottomY: null,
    markersLowX: null,
    markersHighX: null,

    updateRenderSettings() {
        this.amplitudeHigh = amplitudeHigh.value;
        this.amplitudeLow = amplitudeLow.value;
    }
};


delayedChannelButton.addEventListener("click", () => {
    if (startStopButton === "start") {
        if (delayedChannelI == 1) {
            delayedChannelButton.innerText = "Left";
            delayedChannelI = 0;
        } else {
            delayedChannelButton.innerText = "Right";
            delayedChannelI = 1;
        }
    }
})


startButton.addEventListener("click", () => {
    if (startStopButton === "start") {
        delayedChannelButton.disabled = true;

        channelDelaySInput.disabled = true;
        channelDelayS = channelDelaySInput.value;

        startButton.replaceWith(stopButton);
        startStopButton = "stop";


    }
})


stopButton.addEventListener("click", () => {
    if (startStopButton === "stop") {
        stopButton.replaceWith(stoppingButton);
        startStopButton = "stopping";
    }
})


processingSettingsForm.style.display = "grid";
analysisDirectionForm.style.display = "block";

renderer.updateRenderSettings();
renderer.render()
