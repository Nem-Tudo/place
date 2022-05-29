let loadingTime = 0;
let canvas;
let select;
let ctx;
let ctxSelect;
let color;
let oldColor;
let loadingDraw = false;
let timeouted = false;
let selectedPixelInfo = {
    x: null,
    y: null,
    color: null
}
const selectedPixel = {
    x: null,
    y: null,
}

window.onload = () => {
    loadWheel(document.querySelector(".canvas"));
    loadCanvas();
    loadSockets();
    loadAPIs()
}

function loadCanvas() {
    canvas = document.querySelector('#canvas');
    select = document.querySelector('#select');

    ctx = canvas.getContext("2d");
    ctxSelect = select.getContext("2d");

    document.querySelector(".canvas").addEventListener("click", e => paint(e), true);
    document.querySelector(".canvas").addEventListener("contextmenu", e => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();

        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
    
        const x = parseInt((e.clientX - rect.left) * scaleX);
        const y = parseInt((e.clientY - rect.top) * scaleY);

        showPixelInfo(x, y);
    }, true);
    document.querySelector("body").addEventListener("click", e => {

        if(e.target.classList.contains("ignorePixelInfoClose")) return;

        closePixelInfo(document.querySelector(".pixelInfo"));
    }, true);
}

setInterval(async () => {

    if(window.getComputedStyle(document.querySelector(".loading .spin")).display == "none"){
        loadingTime = 0;
    } else {
        loadingTime++;
    }
    if(loadingTime >= 8){
        const request = await fetch("/api/place").catch(e => {
            document.querySelector("#customLoadingMessage").innerHTML = "O servidor está indisponível no momento. Tentando reestabelecer conexão...";
            document.querySelector("#customLoadingMessage").style.display = "block";
        });
        
        if(request?.status === 200) return location.reload();

    } 
}, 1000);


function paint(e) {

    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = parseInt((e.clientX - rect.left) * scaleX);
    const y = parseInt((e.clientY - rect.top) * scaleY);

    ctxSelect.clearRect(0, 0, select.width, select.height);

    ctxSelect.strokeStyle = "#000000";
    ctxSelect.strokeRect(x * 10 - 1, y * 10 - 1, 10 + 2, 10 + 2);

    ctxSelect.strokeStyle = "#ffffff";
    ctxSelect.strokeRect(x * 10 - 2, y * 10 - 2, 10 + 4, 10 + 4);

    ctxSelect.clearRect(x * 10 + 2, y * 10, 6, -2);
    ctxSelect.clearRect(x * 10 + 2, y * 10 + 12, 6, -2);
    ctxSelect.clearRect(x * 10, y * 10 + 2, -2, 6);
    ctxSelect.clearRect(x * 10 + 12, y * 10 + 2, -2, 6);
    
    ctxSelect.clearRect(x * 10 - 3, y * 10 - 3, 10 + 6, 1);
    ctxSelect.clearRect(x * 10 - 3, y * 10 + 12, 10 + 6, 1);
    ctxSelect.clearRect(x * 10 - 3, y * 10 - 3, 1, 15);
    ctxSelect.clearRect(x * 10 + 12, y * 10 - 3, 1, 15);

    if(!selectedPixel.y){
        document.querySelector(".bottom").classList.remove("bottom-hidden");
        document.querySelector(".coord").classList.remove("coord-hidden");
    }
    selectedPixel.x = x;
    selectedPixel.y = y;

    document.querySelector("#coordx").innerText = x;
    document.querySelector("#coordy").innerText = y;

}   

async function draw() {
    if(loadingDraw) return;
    if(timeouted) return;
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

    loadingDraw = true;
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
    loadingDraw = false;

    const responseJson = await response.json();

    if (response.status !== 200){
        if(responseJson.notResetColor != true){
            ctx.fillStyle = oldColor;
            ctx.fillRect(selectedPixel.x, selectedPixel.y, 1, 1);
        }
        alert("Ocorreu um erro ao colocar o pixel: " + responseJson.message)
    }

    if(responseJson.timeout){
        timeouted = true;
        updateButtonTimeout(responseJson.timeout)
    } else {
        document.querySelector("#drawpixel").innerHTML = "Colocar pixel";
        document.querySelector("#drawpixel").disabled = false;
    }
}


document.addEventListener("keypress", e => {
    if(e.keyCode === 32){
        e.preventDefault()
        draw();
    }
})


function rgbToHex(rgb) {
    return "#" + ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1);
}

function updateButtonTimeout(timeout){
    const duration = timeout - Date.now();  

    const interval = setInterval(() => {
        const actualDuration = timeout - Date.now();  

        const minutes = Math.floor(actualDuration / 1000 / 60);
        const seconds = Math.round(actualDuration / 1000 % 60);

        document.querySelector("#drawpixel").innerHTML = `${String(minutes).length == 1 ? "0" + minutes : minutes}:${String(seconds).length == 1 ? "0" + seconds : seconds}`;
    }, 1000);

    setTimeout(() => {
    
        clearInterval(interval);

        document.querySelector("#drawpixel").innerHTML = "Colocar pixel";

        document.querySelector("#drawpixel").disabled = false;
        
        timeouted = false;
    
    }, duration);
}

async function loadAPIs(){
    verifyServerStatus();
    verifyPlayer()
}

async function verifyServerStatus(){
    const response = await fetch("/api/place").then(r => r.json());

    if(response.customLoadingMessage){
        document.querySelector("#customLoadingMessage").innerHTML = response.customLoadingMessage;
        document.querySelector("#customLoadingMessage").style.display = "block";
    }
    
}
async function verifyPlayer(){
    const request = await fetch("/api/player")

    if(request.status !== 200) return;

    const response = await request.json();

    if(response.timeout > Date.now()){
        document.querySelector("#drawpixel").disabled = true;
        timeouted = true;
        updateButtonTimeout(response.timeout);

    }
}

async function showPixelInfo(x, y){

    if (selectedPixelInfo.x == x && selectedPixelInfo.y == y) return;
    selectedPixelInfo.x = x;
    selectedPixelInfo.y = y;

    const pixelInfo = document.querySelector(".pixelInfo");

    if(!pixelInfo.classList.contains("pixelInfo-hidden")) closePixelInfo(pixelInfo)

    document.querySelector(".pixelInfo .position p").innerText = `X: ${x} Y: ${y}`;
    pixelInfo.classList.remove("pixelInfo-hidden");

    const request = await fetch(`/api/pixel?x=${x}&y=${y}`);

    if(request.status !== 200) return closePixelInfo(pixelInfo);

    const response = await request.json();


    document.querySelector(".pixelInfo .color .color-div").style.backgroundColor = response.color;
    document.querySelector(".pixelInfo .color .color-hex").innerHTML = response.color;

    if(response.user){
        document.querySelector(".pixelInfo .author .author-tag").innerText = response.user.tag;
        document.querySelector(".pixelInfo .author .author-avatar").src = response.user.avatar;
        document.querySelector(".pixelInfo .author .author-avatar").style.display = "block";
    }else {
        document.querySelector(".pixelInfo .author .author-tag").innerHTML = "Sistema";
        document.querySelector(".pixelInfo .author .author-avatar").style.display = "none";
    }

    document.querySelector(".pixelInfo .date .date-string").innerHTML = moment(response.timestamp).format("DD/MM/YYYY HH:mm:ss");

    pixelInfo.style.justifyContent = "unset"
    document.querySelector(".pixelInfo .loading").style.display = "none";
    document.querySelector(".pixelInfo .content").style.display = "block";

    setTimeout(() => {
        if(pixelInfo.style.justifyContent == "unset") return;
        
        pixelInfo.style.justifyContent = "unset"
        document.querySelector(".pixelInfo .loading").style.display = "none";
        document.querySelector(".pixelInfo .content").style.display = "block";
    }, 250)


}

function closePixelInfo(pixelInfo){
    pixelInfo.classList.add("pixelInfo-hidden");

    setTimeout(() => {
        pixelInfo.style.justifyContent = "center"
        document.querySelector(".pixelInfo .content").style.display = "none";
        document.querySelector(".pixelInfo .loading").style.display = "block";
    }, 200)
}

function selectColor(){
    if(!selectedPixel.y){
        document.querySelector(".bottom").classList.remove("bottom-hidden");
        document.querySelector(".coord").classList.remove("coord-hidden");
    }
    
    const color = rgbToHex([
        ctx.getImageData(selectedPixelInfo.x, selectedPixelInfo.y, 1, 1).data[0],
        ctx.getImageData(selectedPixelInfo.x, selectedPixelInfo.y, 1, 1).data[1],
        ctx.getImageData(selectedPixelInfo.x, selectedPixelInfo.y, 1, 1).data[2]
    ]);

    document.querySelector("#color").value = color;
}