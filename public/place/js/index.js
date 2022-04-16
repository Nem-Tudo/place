let canvas;
let select;
let ctx;
let ctxSelect;
let color;
let oldColor;

const selectedPixel = {
    x: null,
    y: null,
}

window.onload = () => {
    loadWheel(document.querySelector(".canvas"));
    loadCanvas();
    loadSockets();
}

function loadCanvas() {
    canvas = document.querySelector('#canvas');
    select = document.querySelector('#select');

    ctx = canvas.getContext("2d");
    ctxSelect = select.getContext("2d");

    document.querySelector(".canvas").addEventListener("click", e => paint(e), true);
}

function paint(e) {

    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = parseInt((e.clientX - rect.left) * scaleX);
    const y = parseInt((e.clientY - rect.top) * scaleY);

    ctxSelect.clearRect(0, 0, select.width, select.height);

    ctxSelect.strokeStyle = "#000000";
    ctxSelect.strokeRect(x * 10 - 1, y * 10 - 1, 10 + 2, 10 + 2);

    ctxSelect.clearRect(x * 10 + 2, y * 10, 6, -2);
    ctxSelect.clearRect(x * 10 + 2, y * 10 + 12, 6, -2);
    ctxSelect.clearRect(x * 10, y * 10 + 2, -2, 6);
    ctxSelect.clearRect(x * 10 + 12, y * 10 + 2, -2, 6);

    if(!selectedPixel.y){
        document.querySelector(".bottom").classList.remove("bottom-hidden")
    }
    selectedPixel.x = x;
    selectedPixel.y = y;

}

async function draw() {
    color = document.querySelector('#color').value;

    document.querySelector("#drawpixel").innerHTML = `<img class="spin" id="buttonspin" src="/spin.svg" alt="Loading">`
    document.querySelector("#drawpixel").disabled = true;

    oldColor = rgbToHex([
        ctx.getImageData(selectedPixel.x, selectedPixel.y, 1, 1).data[0],
        ctx.getImageData(selectedPixel.x, selectedPixel.y, 1, 1).data[1],
        ctx.getImageData(selectedPixel.x, selectedPixel.y, 1, 1).data[2]
    ]);
    
    ctx.clearRect(selectedPixel.x, selectedPixel.y, 1, 1);
    
    ctx.fillStyle = color + "50";
    ctx.fillRect(selectedPixel.x, selectedPixel.y, 1, 1);

    const response = await fetch('/api/pixel', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            x: selectedPixel.x,
            y: selectedPixel.y,
            color: color,
            socketid: socket.id
        })
    });

    if (response.status !== 200){
        ctx.fillStyle = oldColor;
        ctx.fillRect(selectedPixel.x, selectedPixel.y, 1, 1);
    }

    const responseJson = await response.json();

    if(responseJson.timeout){
        updateButtonTimeout(responseJson.timeout)
    } else {
        document.querySelector("#drawpixel").innerHTML = "Colocar pixel";
        document.querySelector("#drawpixel").disabled = false;
    }
}


function rgbToHex(rgb) {
    return "#" + ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1);
}

function updateButtonTimeout(timeout){
    const date = moment(timeout).locale("pt-br")
    
    const interval = setInterval(() => {
        document.querySelector("#drawpixel").innerHTML = date.fromNow();
    }, 1000);

    setTimeout(() => {
    
        clearInterval(interval);

        document.querySelector("#drawpixel").innerHTML = "Colocar pixel";

        document.querySelector("#drawpixel").disabled = false;
    
    }, Date.now() - timeout)
}