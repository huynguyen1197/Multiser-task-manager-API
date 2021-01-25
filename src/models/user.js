const mongoose = require("mongoose")
const validator = require("validator")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const Task = require("./task")
const sharp = require('sharp') // to crop and format image

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("Invalid Email")
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error('Age must be a postive number')
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minLength: 7,
        validate(value) {
            if (value.toLowerCase().includes("password")) {
                throw new Error('Password must not contain the word "password"')
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true,
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true,
})

// set up virtual field of user to link to tasks
// won't be saved to DB
userSchema.virtual('tasks', {
    ref: 'Task', // reference to Task
    localField: '_id',
    foreignField: 'owner'
})

// instance method for generate auth token
userSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET)
    user.tokens = user.tokens.concat({ token })
    await user.save()

    return token
}

// instance method for getting public profile
userSchema.methods.toJSON = function () {
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject
}

// set up static login function for model
// must use schema
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email })
    if (!user) {
        throw new Error()
    }
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
        throw new Error()
    }

    return user
}

// use mongoose middleware to hash the plain text password before saving
userSchema.pre("save", async function (next) {
    const user = this

    if (user.isModified("password")) {
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
})

// middleware to delete user's tasks when user is removed
userSchema.pre("remove", async function (next) {
    const user = this
    await Task.deleteMany({ owner: user._id })
    next()
})

// set up the model
const User = mongoose.model("User", userSchema)

module.exports = User