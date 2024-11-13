const canvas = document.getElementsByTagName("canvas")[0];

let activated = false;
let audioContext;
let freqParam, ampParam;
let running = false;
let clicked = false;


function sleep(s) {
    return new Promise(resolve => setTimeout(resolve, s * 1000));
}


async function activate() {
    activated = true;
    audioContext = new AudioContext();

    console.log(1);
    await audioContext.resume();
    console.log(2);
    await audioContext.audioWorklet.addModule(
        "client-runnable/theremin/processor.js?v=!VERSION_STRING"
    );
    console.log(3);

    const workletNode = new AudioWorkletNode(audioContext, "processor");
    console.log(4);
    workletNode.connect(audioContext.destination);
    console.log(5);

    freqParam = workletNode.parameters.get("freq");
    ampParam = workletNode.parameters.get("amp");
    running = true;

    for (let i = 0; i < 10; i++) {
        console.log(`freqParam: ${freqParam}, ampParam: ${ampParam}`);
        await sleep(1);
    }
}


function handleOffsetX(offsetX) {
    const x = offsetX / (canvas.scrollWidth - 1);
    const freq = 220.0 * 4.0 ** x;
    console.log(`freqParam: ${freqParam}, ampParam: ${ampParam}`);
    freqParam.setValueAtTime(freq, audioContext.currentTime);
}


function handleOffsetY(offsetY) {
    const y = offsetY / (canvas.scrollHeight - 1);
    const amp = 100 * 0.01 ** y;
    console.log(`freqParam: ${freqParam}, ampParam: ${ampParam}`);
    ampParam.setValueAtTime(amp, audioContext.currentTime);
}


function handleOffsets(offsets) {
    if (running && clicked) {
        handleOffsetX(offsets.offsetX);
        handleOffsetY(offsets.offsetY);
    }
}


canvas.addEventListener("click", async (event) => {
    if (!activated) {
        activate();

        console.log("activate");
    }

    clicked = true;
    handleOffsets(event);

    console.log("click");
})


canvas.addEventListener("mouseup", async () => {
    clicked = false;
    console.log(`freqParam: ${freqParam}, ampParam: ${ampParam}`);
    ampParam.setValueAtTime(0.0, audioContext.currentTime);

    console.log("unclick");
})


canvas.addEventListener("mousemove", (event) => {
    handleOffsets(event);

    console.log("mousemove");
})


canvas.addEventListener("touchmove", (event) => {
    const lastTouch = event.touches[event.touches.length - 1];
    handleOffsets(lastTouch);

    console.log("touchmove");
})
