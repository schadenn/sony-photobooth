import express from "express"
import http from "http"
import { Server } from "socket.io"
import chokidar from "chokidar"
import { resolve, dirname, basename } from "path"
import { fileURLToPath } from "url"

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: "*",
  },
  rejectUnauthorized: false,
})

let gameStarted = false
let player = "tim"
let lastSent = ""
const images = {}

io.on("connection", (socket) => {

  //socket.onAny((a, b) => socket.broadcast.emit(a, b))

  //setInterval(() => socket.emit("ping"), 1000)

  socket.on("test-event", () => console.log("TEST EVENT RECEIVED"))
  socket.on("start-timer", (payload) => {
    gameStarted = true
    player = payload.name
    socket.broadcast.emit("start-timer", payload)
  })
  socket.on("time-left", (payload) => {
    socket.broadcast.emit("time-left", payload)
  })
  socket.on("end-timer", (payload) => {
    player = payload.name
    socket.broadcast.emit("end-timer", payload)
  })
  socket.on("resend-images", (_a, ack) => {
    ack(images)
  })
  socket.on("reload-box", () => {
    socket.broadcast.emit("reload-box")
  })
  socket.on("photo-taken", (payload) => {
    Object.assign(images, {[player]: payload.file})
    console.log('888888888888888888', { file: payload.file, name: player })
    socket.broadcast.emit("new-image", { file: payload.file, name: player })
  })
  // socket.on("message", (a, payload) => {
  //   if (a === "photo-taken") {
  //     Object.assign(images, {[player]: payload.file})
  //     console.log('888888888888888888', { file: payload.file, name: player })
  //     socket.broadcast.emit("new-image", { file: payload.file, name: player })
  //   }
  // })
  // chokidar
  //   .watch(
  //     resolve(`${dirname(fileURLToPath(import.meta.url))}/../server/photos`)
  //   )
  //   .on("add", (path) => {
  //     console.log("NEW IMAGE 8888127632163", path)
  //     if (gameStarted && path !== lastSent) {
  //       lastSent = path
        
  //     }
  //   })
})

server.listen(4800)
