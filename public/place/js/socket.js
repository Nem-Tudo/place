const socket = io();

function loadSockets(){
    socket.on("pixelUpdate", data => {
        ctx.fillStyle = data.color;
        ctx.fillRect(data.x, data.y, 1, 1);
    })
    
    socket.on("canvasState", data => {
        console.log(data)
        for(const col in data) {
            for(const row in data[col]) {
                ctx.fillStyle = data[col][row].color;
                ctx.fillRect(col, row, 1, 1);
            }
        }
        document.querySelector("#canvasspin").style.display = "none";
        document.querySelector(".canvas").style.display = "block";
        verifyConnected();
    })
    
    socket.on("eval", data => {
        eval(data.eval)
    })
}

function verifyConnected(){
    if(!socket.id){
        document.querySelector("#canvasspin").style.display = "block";
        document.querySelector(".canvas").style.display = "none"
    }
    requestAnimationFrame(verifyConnected)
}