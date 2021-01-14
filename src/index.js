const http = require("http")
const path = require("path")
const express = require("express")
const socketIo = require("socket.io")
const Filter = require("bad-words")
const cors = require("cors")

const { generateMessage, generateLocation } = require("./utils/messages")
const { addUser, removeUser, getUser, getUsersInRoom } = require("./utils/users")

const app = express()
const server = http.createServer(app)
const Io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
})

const port = process.env.PORT

const publicDirPath = path.join(__dirname, "../public")

app.use(cors())
app.use(express.static(publicDirPath))

Io.on("connection", (socket) => {
  console.log("new websocket connection")

  socket.on("join", ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room })

    if (error) {
      return callback(error)
    }

    socket.join(user.room)

    socket.emit("message", generateMessage("Admin", "Welcome"))
    socket.broadcast.to(user.room).emit("message", generateMessage("Admin", `${user.username} has joined`))

    Io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room)
    })

    callback()
  })

  socket.on("sendMessage", (clientMessage, callback) => {
    const filter = new Filter()
    const user = getUser(socket.id)

    if (filter.isProfane(clientMessage)) {
      return callback("Profanity is not allowed!!!")
    }

    Io.to(user.room).emit("message", generateMessage(user.username, clientMessage))
    callback()
  })

  socket.on("sendLocation", ({ latitude, longitude }, callback) => {
    const user = getUser(socket.id)

    Io.to(user.room).emit("locationMessage", generateLocation(user.username, `https://google.com/maps?q=${latitude},${longitude}`))
    callback()
  })

  socket.on("disconnect", () => {
    const user = removeUser(socket.id)

    if (user) {
      Io.to(user.room).emit("message", generateMessage("Admin", `${user.username} has left`))
      Io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room)
      })
    }
  })
})

server.listen(port, () => {
  console.log(`Listening on port ${port}`)
})