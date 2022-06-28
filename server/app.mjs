import express from "express"
import createCamera from "./utils/sonyCamera.mjs"
import cors from "cors"
import process from "process"
import path from "path"
import { readdir } from "fs/promises"
import SSDP from "node-ssdp"
import fetch from "node-fetch"
import parseXml from "fast-xml-parser"

const app = express()
const camera = createCamera()
const client = new SSDP.Client()
let xmlObj = null

const rootDir = path.dirname(process.argv[1])
const photosDir = path.join(rootDir, "photos")

client.on("response", (headers, statusCode, rInfo) => {
  //if (headers.ST === "urn:schemas-sony-com:service:ScalarWebAPI:1")
  //console.log("res", { headers, statusCode, rInfo })
  fetch(headers.LOCATION)
    .then((res) => res.text())
    .then((res) => {
      if (!xmlObj) {
        xmlObj = parseXml.parse(res)
        console.log(xmlObj)
      }
    })
})

client.search("urn:schemas-sony-com:service:ScalarWebAPI:1")

app.use(cors())

app.get("/stopviewfinder", function (req, res) {
  camera.stopLiveview()
  res.send(null)
})

app.get("/startViewfinder", camera.startViewfinder)
app.get("/takePhoto", camera.takePhoto)
app.get("/halfPress", camera.halfPressShutter)
app.get("/startMovieRec", camera.startMovieRec)
app.get("/stopMovieRec", camera.stopMovieRec)
app.get("/getEvent", camera.getEvent)
app.get("/cancelHalfPress", camera.cancelHalfPressShutter)
app.get("/triggerFocus", async function () {
  await camera.halfPressShutter()
  return camera.cancelHalfPressShutter()
})
app.get("/getPhotos", async function (req, res) {
  const files = await readdir(photosDir)
  res.json({ files })
})

app.use("/photos", express.static(photosDir))

app.listen(9000)
