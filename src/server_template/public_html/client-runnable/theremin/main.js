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
    console.log(`A ${running}`);

    for (let i = 0; i < 10; i++) {
        console.log(`x: ${xProportionParam}, y: ${yProportionParam}`);
        await sleep(0.001);
    }


    console.log(`B ${running}`);
}

function handleOffsets(offsets) {

    console.log(`F ${running}`);
    if (running) {

    console.log(`G ${running}`);
        const xProportion = offsets.offsetX / (canvas.scrollWidth - 1);
        const yProportion = offsets.offsetY / (canvas.scrollHeight - 1);
        xProportionParam.setValueAtTime(xProportion, audioContext.currentTime);
        yProportionParam.setValueAtTime(clicked ? yProportion : 3.0, audioContext.currentTime);
    } else {

    console.log(`H ${running}`);
        console.log("not running");
    }
}


canvas.addEventListener("pointerdown", async (event) => {
    if (!activated) {

        console.log(`C ${running}`);
        activate();

    console.log(`D ${running}`);

        console.log("activated");
    }

    clicked = true;

    console.log(`E ${running}`);
    handleOffsets(event);

    console.log("pointerdown");
})


canvas.addEventListener("pointerup", (event) => {
    clicked = false;
    handleOffsets(event);

    console.log("pointerup");
})


canvas.addEventListener("pointermove", (event) => {
    handleOffsets(event);

    console.log("pointermove");
})
