
let scale = 1;
let pointX = 0;
let pointY = 0;
let start = {
    x: 0,
    y: 0
};
let oldx = 0;

function loadWheel(zoom){
    function setTransform() {
        zoom.style.transform = "translate(" + pointX + "px, " + pointY + "px) scale(" + scale + ")";
    }

    zoom.onmousedown = function (e) {
        e.preventDefault();

        start = {
            x: e.clientX - pointX,
            y: e.clientY - pointY
        };
        
        zoom.onmousemove = function (e) {
            e.preventDefault();
    
            pointX = (e.clientX - start.x);
            pointY = (e.clientY - start.y);

            setTransform();
        }

        zoom.onmouseup = function (e) {
            zoom.onmousemove = null;
            zoom.onmouseup = null;
        }

    }



    zoom.onwheel = function (e) {
        e.preventDefault();

        const xs = (e.clientX - pointX) / scale;
        const ys = (e.clientY - pointY) / scale;
        const delta = (e.wheelDelta ? e.wheelDelta : -e.deltaY);
        if(scale > 79.49684720339079 && delta > 0) return;
        if(scale < 0.5787037037037038 && delta < 0) return;

        (delta > 0) ? (scale *= 1.2) : (scale /= 1.2);

        document.querySelector("#coordscale").innerText = String(scale).slice(0, 4) + "x";

        pointX = e.clientX - xs * scale;
        pointY = e.clientY - ys * scale;
        
        setTransform();
    }

    window.addEventListener("keypress", e => {
        if(e.keyCode === 114){
            pointX = 0;
            pointY = 0;
            scale = 1;

            zoom.onmousemove = null;
            zoom.onmouseup = null;
            setTransform();
        }
    })
}