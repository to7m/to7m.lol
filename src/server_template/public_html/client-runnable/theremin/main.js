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

    for (let i = 0; i < 10; i++) {
        console.log(`x: ${xProportionParam}, y: ${yProportionParam}`);
        await sleep(1);
    }
}


function handleOffsetX(offsetX) {
    const xProportion = offsetX / (canvas.scrollWidth - 1);
    console.log(`x: ${xProportionParam}, y: ${yProportionParam}`);
    xProportionParam.setValueAtTime(xProportion, audioContext.currentTime);
}


function handleOffsetY(offsetY) {
    const yProportion = offsetY / (canvas.scrollHeight - 1);
    console.log(`x: ${xProportionParam}, y: ${yProportionParam}`);
    yProportionParam.setValueAtTime(yProportion, audioContext.currentTime);
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
    console.log(`x: ${xProportionParam}, y: ${yProportionParam}`);
    yProportionParam.setValueAtTime(-2.0, audioContext.currentTime);

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
