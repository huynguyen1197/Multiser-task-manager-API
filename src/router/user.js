const express = require("express")
const User = require("../models/user")
const auth = require("../middleware/auth")
const multer = require("multer") // multer for uploading file
const sharp = require("sharp") // for crop and format image
const {
    sendWelcomeEmail,
    sendCancellationEmail
} = require("../emails/account")

// create router
const router = new express.Router()

// add user (sign up)
router.post("/users", async (req, res) => {
    const user = new User(req.body)

    try {
        await user.save()
        sendWelcomeEmail(user.email, user.name)
        const token = await user.generateAuthToken()
        res.status(201).send({ user, token })
    } catch (e) {
        res.status(400).send(e)
    }
    // res.status(201).send(user)
    // user.save().then(() => {
    //     res.status(201).send(user)
    // }).catch((e) => {
    //     res.status(400).send(e)
    // })
})

// log in
router.post("/users/login", async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({ user, token })

        //res.send({ user: user.getPublicProfile(), token })
    } catch (e) {
        res.status(400).send({ error: "Unable to login" })
    }
})

const upload = multer({
    // dest: 'avatars', // use this to save to avatars directory . Remove to save to database
    // access via req.file if  dest not there
    limits: {
        fileSize: 1000000 // limit 1MB
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error("Please upload only image!"))
        }

        cb(undefined, true)
    }
})

// route for uploading avatar
// single('avatar') parameter matches form-data key
// 
router.post("/users/me/avatar", auth, upload.single('avatar'), async (req, res) => {

    //req.user.avatar = req.file.buffer

    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()

    req.user.avatar = buffer


    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

// router for getting avatar
router.get("/users/me/avatar", auth, async (req, res) => {
    try {
        const avatar = req.user.avatar
        if (!avatar) {
            throw new Error()
        }

        res.set("Content-Type", 'image/png') // set header
        res.send(avatar)
    } catch (e) {
        res.status(404).send()
    }
})

// route for deleting avatar
router.delete("/users/me/avatar", auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

// log out
router.post("/users/logout", auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

//log out all sessions
router.post("/users/logoutall", auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

// read profile
// added middleware to auth
router.get("/users/me", auth, async (req, res) => {

    // send user stored by auth function
    res.send(req.user)

    // try {
    //     const users = await User.find({})
    //     res.send(users)
    // } catch (e) {
    //     res.status(500).send()
    // }

    // User.find({}).then((users) => {
    //     res.send(users)
    // }).catch((e) => {
    //     res.status(500).send()
    // })
})

// update user
router.patch("/users/me", auth, async (req, res) => {

    // check if updates received from PATCH request is valid
    const updates = Object.keys(req.body) // convert to array of updates
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update) => {
        return allowedUpdates.includes(update.toLowerCase())
    })

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates' })
    }

    try {

        // const user = await User.findById(req.params.id)
        const user = req.user
        updates.forEach((update) => {
            user[update] = req.body[update]
        })
        await user.save()

        // const _id = req.params.id

        // find by ID and Update bypass middleware
        // const user = await User.findByIdAndUpdate(_id, req.body, {
        //     new: true, // return user with update applied
        //     runValidators: true // validate new updates
        // })
        res.send(user)

    } catch (e) {
        res.status(400).send(e)
    }
})

// delete user
router.delete("/users/me", auth, async (req, res) => {
    try {
        // const user = await User.findByIdAndDelete(req.user._id)
        // if (!user) {
        //     res.status(404).send()
        // }
        await req.user.remove()
        sendCancellationEmail(req.user.email, req.user.name)
        res.send(req.user)
    } catch (e) {
        res.status(500).send()
    }
})

module.exports = router