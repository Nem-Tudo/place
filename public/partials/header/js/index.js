let popupenabled = false;

function toggleUserPopup() {
    const popup = document.querySelector("#userpopup");

    if (popupenabled === false) {
        popup.classList.remove("popup-hidden");
        popupenabled = true;
        document.querySelector("main").addEventListener("click", toggleUserPopup);
    } else {
        popup.classList.add("popup-hidden");
        popupenabled = false;
        document.querySelector("main").removeEventListener("click", toggleUserPopup);
    }
}