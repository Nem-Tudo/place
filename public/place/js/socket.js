const socket = io(window.location.origin, { query: "canvaspage=true" });

let received = false;

function loadSockets(){
    socket.on("pixelUpdate", data => {
        ctx.fillStyle = data.color;
        ctx.fillRect(data.x, data.y, 1, 1);
    })

    if(!received){
        socket.emit("getCanvasState")
    }
    
    socket.on("reload", data => {
        location.reload()
    })

    socket.on("canvasState", data => {
        console.log(data)
        document.querySelector(".loading h1").style.display = "none";
        loadingTime = 0;
        received = true;
        console.log(data.canvas)
        loadState(JSON.parse(data.canvas));
    })
    
    socket.on("inPlace", data => {
        if(!data?.inPlace){
            location.reload();
        }
    })

    socket.on("eval", data => {
        eval(data.eval)
    })
}

function verifyConnected(){
    if(!socket.id){
        document.querySelector("#canvasspin").style.display = "block";
        document.querySelector(".canvas").style.display = "none";
        verifyServerStatus();
    }
    requestAnimationFrame(verifyConnected)
}


function loadState(canvas){
    for(const col in canvas) {
        for(const row in canvas[col]) {
            ctx.fillStyle = canvas[col][row].color;
            ctx.fillRect(col, row, 1, 1);
        }
    }
    
    document.querySelector("#canvasspin").style.display = "none";
    document.querySelector(".canvas").style.display = "block";
    
    verifyConnected();
}