
import 'dotenv/config'

import { stdin, stdout } from 'node:process';

const GameState = {
    inning: "number",
    home: "team",
    away: "team",
    outPlayers: ["numbers"],
    strikerIndex: "number",
    nonStrikerIndex: "number",
    bowlerIndex: "number",
    altBowlerIndex: "number",
}

// const Team = {
//     name: "",
//     players: [Player]
// }

const Player = {
    running: "number",
    batting: "number",
    bowling: "number",
    fielding: "number",
    leftHanded: "boolean",

    //batting
    longsquare: "number",
    sillydeep: "number",

    firstName: "string",
    lastName: "string",

    post: "number",
    posr: "number"
}

function randn_bm() {
    let u = 0, v = 0;
    while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    let num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    num = num / 10.0 + 0.5; // Translate to 0 -> 1
    if (num > 1 || num < 0) return randn_bm() // resample between 0 and 1
    return num
  }

import * as fs from 'fs';
const names = JSON.parse(fs.readFileSync('./names.json'));

function generatePlayer(){
    let playerObject = {}
    playerObject.posr = Math.pow(1/0.35 * Math.random() - 1.2, 3) * 10 + 25;
    playerObject.post = Math.random() * 2 * Math.PI;

    playerObject.running = randn_bm();
    playerObject.batting = randn_bm();
    playerObject.bowling = randn_bm();
    playerObject.fielding = randn_bm();

    playerObject.leftHanded = Math.random() < 0.106 ? true : false;

    playerObject.longsquare = randn_bm();
    playerObject.sillydeep = randn_bm();

    playerObject.tightness = randn_bm()

    playerObject.firstName = names.firstNames[Math.floor(Math.random()*names.firstNames.length)]
    playerObject.lastName = names.lastNames[Math.floor(Math.random()*names.lastNames.length)]

    return playerObject
}

const Field = {
    silly: 5,
    short: 14,
    deep: 80,
    //angle 0 is backwards
}


// 1. Bowl vs Batting
// 2. If hit, Batting + handedness = landing position
// 3. Instant Catch: within 3 units of player
function radsToDeg(rad){
    return rad * 180 / Math.PI
}
function degToRad(deg){
    return deg * Math.PI / 180
}


function calcDistance(pos1, pos2){
    pos1.x = pos1.r * Math.cos(pos1.t)
    pos1.y = pos1.r * Math.sin(pos1.t)
    pos2.x = pos2.r * Math.cos(pos2.t)
    pos2.y = pos2.r * Math.sin(pos2.t)
    return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2))
}

function generatePlay(gameState){

    let nextGameState = JSON.parse(JSON.stringify(gameState))
    nextGameState.call = ""
    nextGameState.updatePlayers = false;

    let battingTeam = gameState.homeTeam;
    let fieldingTeam = gameState.awayTeam;

    if(gameState.inning % 2 == 1) {
        battingTeam = gameState.awayTeam;
        fieldingTeam = gameState.homeTeam;
    }

    let batter = battingTeam.players[gameState.strikerIndex]
    let bowler = fieldingTeam.players[gameState.bowlerIndex]

    if(gameState.balls === 0) nextGameState.call += `${bowler.firstName} ${bowler.lastName} bowling.\n`

    if(gameState.outs.length >= battingTeam.players.length - 1){
        nextGameState.call += `Inning Over!\n`
        nextGameState.inning ++
        nextGameState.outs = []
        nextGameState.balls = 0
        nextGameState.strikerIndex = 0
        nextGameState.bowlerIndex = 0
        nextGameState.wicketKeeperIndex = 1
        nextGameState.nonStrikerIndex = 1
        return nextGameState
    }

    nextGameState.call += `${batter.firstName} ${batter.lastName} is up to bat!\n`

    if((batter.batting+Math.random())/2 > (bowler.bowling+Math.random())/2){
        let ballLocation = ballHit(batter)
        // console.log(calcDistance(ballLocation, {t:0,r:0}))
        let closestPlayer = -1;
        let closestDistance = Number.MAX_VALUE;
        for (let index = 0; index < fieldingTeam.players.length; index++) {
            const element = fieldingTeam.players[index];
            if(index === gameState.bowlerIndex){
                element.posr = 20;
                element.post = 0;
            } else if (index === gameState.wicketKeeperIndex) {
                element.posr = 0;
                element.post = 0;
            }
            let distance = calcDistance({t: element.post, r: element.posr}, ballLocation)
            if( distance < closestDistance){
                closestDistance = distance;
                closestPlayer = index;
            }
            // console.log(calcDistance({r: element.posr, t: element.post}, ballLocation))
        }
        // console.log("Closest player is", fieldingTeam.players[closestPlayer].firstName, closestDistance)
        if(calcDistance(ballLocation, {t:0,r:0}) > 80) {
            let runs = Math.random() > 0.5 ? 4 : 6;
            nextGameState.call = `Boundry! ${runs} runs!\n`
            if(gameState.inning % 2 === 0){
                nextGameState.homeRuns += runs
            } else {
                nextGameState.awayRuns += runs
            }
        } else if(closestDistance < 10) {
            nextGameState.call += `Caught Out by ${fieldingTeam.players[closestPlayer].firstName} ${fieldingTeam.players[closestPlayer].lastName}!\n`
            nextGameState.outs.push(gameState.strikerIndex)
            while (nextGameState.outs.includes(nextGameState.strikerIndex)) nextGameState.strikerIndex ++
        } else {
            //At this point we calculate runs based on running of closest player and pitching of closest player
            //Running is more important then pitching
            //Calculate "time" units, then compare with running of the fielding player
            //Do fancy math to see if they are out or safe
            let runs = Math.floor(Math.random() * 7 + 1)
            if(runs % 2 === 1) {
                nextGameState.strikerIndex = gameState.nonStrikerIndex
                nextGameState.nonStrikerIndex = gameState.strikerIndex        
            }
            if(gameState.inning % 2 === 0){
                nextGameState.homeRuns += runs
            } else {
                nextGameState.awayRuns += runs
            }
            nextGameState.call += `${runs} runs!\n`
        }
    } else {


        nextGameState.outs.push(gameState.strikerIndex)

        while (nextGameState.outs.includes(nextGameState.strikerIndex)) nextGameState.strikerIndex ++

        if(Math.random() < 0.01) {
            nextGameState.call += `Leg Before Wicket!\n🔥${batter.firstName} ${batter.lastName} is elminated!🔥\n`

            nextGameState.updatePlayers = true;

            let newPlayer = generatePlayer()
            if(gameState.inning % 2 == 1) {
                nextGameState.awayTeam.players[gameState.strikerIndex] = newPlayer;
            } else {
                nextGameState.homeTeam.players[gameState.strikerIndex] = newPlayer;
            }

            nextGameState.call += `${batter.firstName} ${batter.lastName} is replaced by ${newPlayer.firstName} ${newPlayer.lastName}`
            
        } else {
            nextGameState.call += "Bowled!\n"
        }
    }

    nextGameState.balls++

    if(nextGameState.balls >= 6) {
        nextGameState.bowlerIndex = gameState.wicketKeeperIndex
        nextGameState.wicketKeeperIndex = gameState.bowlerIndex

        nextGameState.strikerIndex = gameState.nonStrikerIndex
        nextGameState.nonStrikerIndex = gameState.strikerIndex

        nextGameState.call += "Over!\n"

        nextGameState.balls = 0
    }

    nextGameState.call = nextGameState.call.trim()
    console.log(nextGameState.call)
    return nextGameState;
}

function ballHit(player){
    // Hit
            // angle random between 135deg and 200 deg or small chance of full random angle
            // fn(angle) = ((65 * rand) + 135) * (longsquare * rand) + 135 + (-20 * longsquare)
    let randNum = Math.random()
    let t = (((65 * randNum) + 135) * (player.longsquare * randNum) + 135 + (-20 * player.longsquare))
    // let t = randNum/Math.PI
    
    // if lefthanded, map onto inverse range 0-360, fn(mappedangle) = (angle)/(360) * -360 + 360
    if( player.leftHanded ) t = t/360 * -360 + 360

    t *= Math.PI / 180

            // distance weighted random between -10 and 50 fn(distance) = rand * 5 * sillydeep
    randNum = randn_bm()
    let r = (randNum * 100) - 5 * player.sillydeep
            // find closest player
                // instant catch if distance < fielding * 5
                // if not instant catch, speed / distance for who catches

    if( r < 0 ){
        r = Math.abs(r)
        t -= Math.PI
    }


    return {t: t ?? 0, r: r ?? 0}
}


let initialHomeTeam = {
    name: "Doors",
    players: [...Array(11)].map(p=>generatePlayer())
}

let initialAwayTeam = {
    name: "Wheels",
    players: [...Array(11)].map(p=>generatePlayer())
}

const initalGameState = {
    inning: 0,
    homeTeam: initialHomeTeam,
    awayTeam: initialAwayTeam,
    homeRuns: 0,
    awayRuns: 0,
    strikerIndex: 0,
    bowlerIndex: 0,
    wicketKeeperIndex: 1,
    nonStrikerIndex: 1,
    balls: 0,
    outs: [],
    call: ""
}

//Load Game State:
const persistantGameState = fs.existsSync(process.env.STATE_INPUT) ? JSON.parse(fs.readFileSync(process.env.STATE_INPUT)) : {};

let gameState = JSON.parse(JSON.stringify({...initalGameState, ...persistantGameState}))

console.log(gameState)

setImmediate(()=>{
    gameState = generatePlay(gameState)
    fs.writeFileSync(process.env.STATE_OUTPUT, JSON.stringify(gameState))
})
setInterval(()=>{
    gameState = generatePlay(gameState)
    fs.writeFileSync(process.env.STATE_OUTPUT, JSON.stringify(gameState))
}, process.env.DELAY)

// console.time("runGame")

// //Run a 4 inning game
// while (gameState.inning < 50) {
//     gameState = generatePlay(gameState)
// }
// console.log(`Final Score: Home ${gameState.homeRuns}. Away ${gameState.awayRuns}`)

// console.timeEnd("runGame")


// let totalDistance = 0;
// let max = 0;
// let min = Number.MAX_VALUE;
// for (let index = 0; index < 1000; index++) {
//     let player = generatePlayer()
//     let loc = ballHit(player)
//     let dist = calcDistance({t: 0, r: 0}, loc)
//     totalDistance += dist
//     if(dist < min){
//         min = dist
//     }
//     if(dist > max){
//         max = dist
//     }
// }
// console.log(totalDistance/1000)
// console.log(min, max)

// console.log(calcDistance({t: 0, r:50}, {t: 0, r: 0}))



// let graph = [...Array(150)].map(e=>Array(150).fill(0))
// graph.forEach(a=>a.map(a=>0))
// for (let index = 0; index < 1000; index++) {
//     let batter = generatePlayer()
//     let x = Math.floor(batter.posr * Math.cos(batter.post)) + 75
//     let y = Math.floor(batter.posr * Math.sin(batter.post)) + 75
//     if(x < 0 || y < 0) continue;
//     graph[x][y] += 1
// }

// let yres = 5;
// let xres = 5;

// for (let i = 0; i < graph.length; i+=yres) {
//     const element = graph[i];
//     for (let j = 0; j < element.length; j+=xres) {
//         const count = element[j];

//         let average = 0;
//         for (let indexy = 0; indexy < 1; indexy++) {
//             for (let indexx = 0; indexx < xres; indexx++) {
//                 let icon = graph[i+indexy][j+indexx]
//                 if(Number.isInteger(icon)) average += icon
//                 // console.log(average)
//             }
//         }

//         // average /= 5

//         let val = Math.min(average*50, 255);
//         if(i==75&&j==75) stdout.write(`\x1b[48;2;0;255;0m`)
//         stdout.write(`\x1b[38;2;${val.toString()};${val.toString()};${val.toString()}m#`)
//         if(i==75&&j==75) stdout.write(`\x1b[0m`)
        
//     }
//     stdout.write("\n")
// }