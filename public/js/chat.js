const socket = io()

// ****** Elements **********
const $form = document.getElementById("form")
const $formInput = $form.querySelector("input")
const $formButton = $form.querySelector("button")
const $sendLocationButton = document.getElementById("send-location")
const $messages = document.getElementById("messages")
const $sidebar = document.getElementById("sidebar")


// ****** Templates *******
const messageTemplate = document.querySelector("#message-template").innerHTML
const locationTemplate = document.querySelector("#location-message-template").innerHTML
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML


// ****** Options ********
const { username, room } = Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoscroll = () => {
  // get message element
  const $newMessage = $messages.lastElementChild

  // get height of newMessage
  const newMessageStyles = getComputedStyle($newMessage)
  const newMessageMargin = parseInt(newMessageStyles.marginBottom)
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

  // visible height
  const visibleHeight = $messages.offsetHeight

  // height of messages container
  const containerHeight = $messages.scrollHeight

  // distance scrolled from top
  const scrollOffset = $messages.scrollTop + visibleHeight

  if ((containerHeight - newMessageHeight) <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight
  }
}


// ******** Socket Event Listeners *************
socket.on("message", (message) => {
  const html = Mustache.render(messageTemplate, {
    username:message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format("h:mm a")
  })
  $messages.insertAdjacentHTML("beforeend", html)
  autoscroll()
})

socket.on("locationMessage", (message) => {
  const html = Mustache.render(locationTemplate, {
    username: message.username,
    url: message.url,
    createdAt: moment(message.createdAt).format("h:mm a"),
  })

  $messages.insertAdjacentHTML("beforeend", html)
  autoscroll()
})

socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  })
  $sidebar.innerHTML = html
})


$form.addEventListener('submit', (e) => {
  e.preventDefault()

  // disabling form after submittion
  $formButton.setAttribute("disabled", "disabled")

  const clientMessage = e.target.elements.message.value

  socket.emit("sendMessage", clientMessage, (error) => {
    // enabling form button
    $formButton.removeAttribute("disabled")
    $formInput.value = ""
    $formInput.focus()

    if (error) {
      return console.log(error)
    }

    console.log("Delivered..")
  })
})


$sendLocationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported by your Browser")
  }

  // disabling button
  $sendLocationButton.setAttribute("disabled", "disabled")

  navigator.geolocation.getCurrentPosition((position) => {
    const { longitude, latitude } = position.coords
    const location = {
      longitude,
      latitude
    }
    socket.emit("sendLocation", location, () => {
      // enabling button
      $sendLocationButton.removeAttribute("disabled")
      console.log("Location shared!")
    })
  })
})

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error)
    location.href = "/"
  }
})