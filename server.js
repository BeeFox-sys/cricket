import "dotenv/config"
import fs from "fs"

import express, { json } from "express"
const app = express()

import { watch } from "node:fs/promises"

const ac = new AbortController();
const { signal } = ac;

let state;

(async () => {
    try {
      const watcher = watch(process.env.PERSISTANT_STATE, { signal });
      for await (const event of watcher)
        if(event.eventType === "change"){
          let jsonfile = fs.readFileSync(process.env.PERSISTANT_STATE)
          try{
            state = JSON.parse(jsonfile);
          } catch (err) {
            if(err.message === "Unexpected end of JSON input"){
              console.error("File was still being written to.")
            } 
            else console.error(err.message)
            // console.error(err)
            // console.error(jsonfile.toString())
          }
        }
    } catch (err) {
      if (err.name === 'AbortError')
        return;
      throw err;
    }
  })(); 


app.use("/gameState", (req, res) => {
  res.json({...state, ...{memorial: null}})
})
app.use("/memorial", (req, res) => {
  res.json({memorial: state.memorial})
})
app.use("/static", express.static("./static",{root: "."}))
app.use("/", (req, res)=>{res.sendFile("./static/index.html", {root:"."})})
app.listen(process.env.PORT, ()=>{console.log("Listening on",process.env.PORT)})


