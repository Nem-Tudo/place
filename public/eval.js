const socket = io();

socket.on("eval", data => {
    eval(data.eval)
})