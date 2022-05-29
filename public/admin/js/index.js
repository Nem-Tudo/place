let oldstats;
let lastmessagesenddate = 0;


window.onload = () => {
    loadstats();
    // loadevents();
}

function loadstats() {

    updateStatus();
    setInterval(updateStatus, 1000)

}

async function updateStatus() {
    const stats = await fetch("/api/status").then(r => r.json());

    if (JSON.stringify(stats) == JSON.stringify(oldstats)) return;

    if (stats.stats) {
        document.querySelector("#pixelCount").innerText = stats.stats.placePixeis;

        document.querySelector("#onlineplace").innerText = stats.stats.online.place;
        document.querySelector("#onlinemenu").innerText = stats.stats.online.menu;

        document.querySelector("#uses").innerText = stats.stats.uses;
    }

    if (JSON.stringify(stats.sentAdminMessages) != JSON.stringify(oldstats?.sentAdminMessages)) {
        document.querySelector(".messagehistory").innerHTML = "";

        if (stats.sentAdminMessages.length <= 0) {
            document.querySelector(".messagehistory").innerHTML = "<p style='color: #ffffffa1'>Vazio...</p>";
        }

        stats.sentAdminMessages.forEach(message => {
            document.querySelector(".messagehistory").innerHTML += `<div class="messageobj"><p class="messageauthor">${message.user.tag}:</p><p class="messagecontent">${message.message}</p></div>`;
        });
    }

    if (JSON.stringify(stats.bannedUsersMessages) != JSON.stringify(oldstats?.bannedUsersMessages)) {
        document.querySelector(".banhistory").innerHTML = "";

        if (stats.bannedUsersMessages.length <= 0) {
            document.querySelector(".banhistory").innerHTML = "<p style='color: #ffffffa1'>Vazio...</p>";
        }

        stats.bannedUsersMessages.forEach(ban => {
            document.querySelector(".banhistory").innerHTML += `<p class="bancase"><span class="author">${ban.staff}</span> ${ban.action} <span class="user">${ban.user}</span>. ${ban.reason ? `Motivo: <span class="reason">${ban.reason}</span></p>` : ""}`;
        });
    }

    if (JSON.stringify(stats.bannedUsers) != JSON.stringify(oldstats?.bannedUsers)) {
        document.querySelector(".bannedusers").innerHTML = "";

        if (stats.bannedUsers.length <= 0) {
            document.querySelector(".bannedusers").innerHTML = "<p style='color: #ffffffa1'>Vazio...</p>";
        }

        stats.bannedUsers.forEach(ban => {
            document.querySelector(".bannedusers").innerHTML += `<div class="banneduser">
            <img onerror="this.src='https://cdn.discordapp.com/embed/avatars/1.png'" class="banneduseravatar" src="${ban.avatar ? ban.avatarURL : "https://cdn.discordapp.com/embed/avatars/1.png"}" alt="User avatar">
            <p class="bannedusertag">${ban.tag}</p>
            <div class="banneduseroptions">
                <img src="/admin/img/eye.svg" onclick="viewbaninfo('${ban.id}', true)"alt="eye" class="viewbanneduserinfo">
                <img src="/admin/img/x.svg" onclick="unbanuser('${ban.id}')"alt="x" class="unbanbanneduser">
            </div>
        </div>`
        });
    }

    oldstats = stats;
}


//functions

async function unbanuser(userid) {
    const request = await fetch("/api/admin/ban", {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            user: userid
        })
    })

    updateStatus()
    const response = await request.json();

    if (request.status !== 200) {
        alert(`Erro: ${response.message}`);
    }
}

async function banuser(userid) {
    const request = await fetch("/api/admin/ban", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            user: userid,
            reason: document.querySelector("#banreason").value || undefined
        })
    })

    updateStatus()
    const response = await request.json();

    document.querySelector("#banuser").value = ""


    if (request.status !== 200) {
        alert(`Erro: ${response.message}`);
    }
    togglebanpopup(false)
}

async function togglebanpopup(open, id) {
    if (open) {

        if (!id) return alert("coloque um id");

        const request = await fetch("/api/player?id=" + id,)

        const response = await request.json();

        if (request.status !== 200) return alert(response.message)

        document.querySelector("#bantag").innerText = response.user.tag;

        document.querySelector('.banpopup').classList.remove('generalpopup-hidden');
        document.querySelector(".popups").style.width = "100vw";
    } else {
        document.querySelector('.banpopup').classList.add('generalpopup-hidden');
        document.querySelector(".popups").style.width = "0";
        setTimeout(() => {
            document.querySelector("#bantag").innerText = "{{user}}";
            document.querySelector("#banreason").value = "";
        }, 200)

    }
}

async function sendMessage(message) {

    if (lastmessagesenddate + 1000 > Date.now()) return;

    lastmessagesenddate = Date.now();

    const request = await fetch("/api/admin/message", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            message: message
        })
    })

    updateStatus()
    const response = await request.json();

    if (request.status !== 200) {
        alert(`Erro: ${response.message}`);
    }

    document.querySelector("#message").value = "";
}

async function executeEval(eval) {
    const request = await fetch("/api/admin/eval", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            eval: eval
        })
    })

    updateStatus()
    const response = await request.json();

    if (request.status !== 200) {
        alert(`Erro: ${response.message}`);
    }
    alert(response.result)

}

async function viewbaninfo(userid, open) {
    if (open) {
        const request = await fetch("/api/player?id=" + userid)
        const response = await request.json();

        if (request.status !== 200) {
            alert(`Erro: ${response.message}`);
        }

        if (!response.banned.banned) return alert("Usuário não está banido");

        const bannedAt = response.banned.bannedAt.split("T")[0].split("-")

        document.querySelector(".unbanviewpopup h1").innerText = response.user.tag;
        document.querySelector(".unbanviewpopup #bannedby span").innerText = response.banned.bannedBy;
        document.querySelector(".unbanviewpopup #bannedon span").innerText = `${bannedAt[2]}/${bannedAt[1]}/${bannedAt[0]}`;
        document.querySelector(".unbanviewpopup #bannedreason").innerText = response.banned.reason;
        document.querySelector('.unbanviewpopup').classList.remove('generalpopup-hidden');
        document.querySelector(".popups").style.width = "100vw";

    } else {
        document.querySelector('.unbanviewpopup').classList.add('generalpopup-hidden');
        setTimeout(() => {
            document.querySelector(".unbanviewpopup h1").innerText = "{{user}}";
            document.querySelector(".unbanviewpopup #bannedby span").innerText = "{{staff}}";
            document.querySelector(".unbanviewpopup #bannedon span").innerText = "{{date}}";
            document.querySelector(".unbanviewpopup #bannedreason").innerText = "{{date}}";
        }, 500)
        document.querySelector(".popups").style.width = "0";
    }
}