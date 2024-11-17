const canvas = document.getElementsByTagName("canvas")[0];

let activated = false;
let audioContext;
let xProportionParam, yProportionParam;
let running = false;
let clicked = false;


function sleep(s) {
    return new Promise(resolve => setTimeout(resolve, s * 1000));
}


async function activate() {
    activated = true;
    audioContext = new AudioContext();

    await audioContext.resume();
    await audioContext.audioWorklet.addModule(
        "client-runnable/theremin/processor.js?v=!VERSION_STRING"
    );

    const workletNode = new AudioWorkletNode(audioContext, "processor");
    workletNode.connect(audioContext.destination);

    xProportionParam = workletNode.parameters.get("xProportion");
    yProportionParam = workletNode.parameters.get("yProportion");
    running = true;
}

function handleOffsets(offsets) {
    if (running) {
        const xProportion = offsets.offsetX / (canvas.scrollWidth - 1);
        const yProportion = offsets.offsetY / (canvas.scrollHeight - 1);
        xProportionParam.setValueAtTime(xProportion, audioContext.currentTime);
        yProportionParam.setValueAtTime(clicked ? yProportion : 3.0, audioContext.currentTime);
    }
}


canvas.addEventListener("pointerdown", async (event) => {
    console.log("starting pointerdown");

    if (!activated) {
        await activate();
    }

    clicked = true;
    handleOffsets(event);

    event.preventDefault();

    console.log("exiting pointerdown");
})


canvas.addEventListener("pointerup", (event) => {
    console.log("starting pointerup");

    clicked = false;
    handleOffsets(event);

    event.preventDefault();

    console.log("exiting pointerup");
})


canvas.addEventListener("pointermove", (event) => {
    console.log("starting pointermove");

    handleOffsets(event);


    event.preventDefault();

    console.log("exiting pointermove");
})
