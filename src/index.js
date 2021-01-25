const express = require("express")
require('./db/mongoose') // run mongoose file
const userRouter = require("./router/user")
const taskRouter = require("./router/task")
const multer = require("multer") // multer for uploading file

const app = express()
const port = process.env.PORT

// set up to automatically parse incoming json POST
app.use(express.json())
app.use(userRouter) // register router for users
app.use(taskRouter) // register router for tasks


app.listen(port, () => {
    console.log("Server is up on port " + port);
})

