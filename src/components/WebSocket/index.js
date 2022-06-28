import { io } from "socket.io-client"

export const socket = io("http://localhost:4800")

socket.onAny((a, b, c) => console.log("HAPPENED", a, b, c))

socket.on("reload-box", (payload) => {
  console.log("RELOADING THROUGH WEBSOCKET")
  window.location.href = window.location.href
})

window.WEBSOCKET1 = socket
