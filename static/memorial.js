async function initalLoad(){
    let memorial = (await fetch("/memorial.json").then((res)=>(res.json()))).memorial

    load()

    document.querySelector("#memorial .players").innerHTML = ""


    memorial.players.forEach(addPlayer, document.querySelector("#memorial .players"));

}

function addPlayer(player){
    let playerObject = document.createElement("details")
    playerObject.classList.add("player")

    let playerName = document.createElement("summary")
    playerName.classList.add("playerName")
    playerName.innerText = `${player.firstName} ${player.lastName}`
    playerObject.appendChild(playerName)

    let batting = document.createElement("span")
        batting.innerHTML = `Batting<span class="stars" style="--_percent:${player.batting.toPrecision(2) * 100}%">⭐⭐⭐⭐⭐</span>`
        batting.classList.add("stat")
        playerObject.appendChild(batting)
    let running = document.createElement("span")
        running.innerHTML = `Running<span class="stars" style="--_percent:${player.running.toPrecision(2) * 100}%">⭐⭐⭐⭐⭐</span>`
        running.classList.add("stat")
        playerObject.appendChild(running)
    let bowling = document.createElement("span")
        bowling.classList.add("stat")
        bowling.innerHTML = `Bowling<span class="stars" style="--_percent:${player.bowling.toPrecision(2) * 100}%">⭐⭐⭐⭐⭐</span>`
        playerObject.appendChild(bowling)
    let fielding = document.createElement("span")
        fielding.innerHTML = `Fielding<span class="stars" style="--_percent:${player.fielding.toPrecision(2) * 100}%">⭐⭐⭐⭐⭐</span>`
        fielding.classList.add("stat")
        playerObject.appendChild(fielding)

    this.appendChild(playerObject)

}

async function load(){
    let gameState = await fetch("/gameState.json").then((res)=>res.json())
    if(gameState.updatePlayers) return initalLoad();
}

initalLoad()

setInterval(load, 1000)
