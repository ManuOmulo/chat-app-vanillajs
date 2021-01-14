const generateMessage = (username, text) => {
  return {
    username,
    text: text,
    createdAt: new Date().getTime()
  }
}

const generateLocation = (username, url) => {
  return {
    username,
    url: url,
    createdAt: new Date().getTime()
  }
}

module.exports = {
  generateMessage,
  generateLocation,
}