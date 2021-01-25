const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)
const myEmail = 'tranhuy11111997@gmail.com'


const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        from: myEmail,
        to: email,
        subject: "Welcome to task app.",
        text: `Hello ${name}, welcome to the app.`,
    }).then().catch()
}

const sendCancellationEmail = (email, name) => {
    sgMail.send({
        from: myEmail,
        to: email,
        subject: "We are sorry to hear that you are leaving.",
        text: `Hello ${name}, it has been a great time to work with you.`
    }).then().catch()
}

module.exports = {
    sendWelcomeEmail,
    sendCancellationEmail
}