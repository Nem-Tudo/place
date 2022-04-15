let canvas;
let select;
let ctx;
let ctxSelect;
let color;
const selectedPixel = {
    x: null,
    y: null,
}

window.onload = () => {
    loadWheel(document.querySelector(".canvas"))
    loadCanvas()
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

    selectedPixel.x = x;
    selectedPixel.y = y;

}

async function draw() {
    color = document.querySelector('#color').value;

    ctx.fillStyle = color + "50";
    ctx.fillRect(selectedPixel.x, selectedPixel.y, 1, 1);

    fetch('/api/pixel', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            x: selectedPixel.x,
            y: selectedPixel.y,
            color: color
        })
    });
}