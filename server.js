import "dotenv/config"
import fs from "fs"

import express from "express"
const app = express()

import { watch } from "node:fs/promises"

const ac = new AbortController();
const { signal } = ac;

(async () => {
    try {
      const watcher = watch(process.env.PERSISTANT_STATE, { signal });
      for await (const event of watcher)
        if(event.eventType === "change"){
          try{
            let state = fs.existsSync(process.env.PERSISTANT_STATE) ? JSON.parse(fs.readFileSync(process.env.PERSISTANT_STATE)) : {};
            console.log(state)
          } catch (err) {
            console.error("Json Read Error")
          }
        }
    } catch (err) {
      if (err.name === 'AbortError')
        return;
      throw err;
    }
  })(); 


app.use("/gameState", (req, res)=>{res.sendFile(process.env.PERSISTANT_STATE, {root:"."})})
app.use("/static", express.static("./static",{root: "."}))
app.use("/", (req, res)=>{res.sendFile("./static/index.html", {root:"."})})
app.listen(process.env.PORT, ()=>{console.log("Listening on",process.env.PORT)})


