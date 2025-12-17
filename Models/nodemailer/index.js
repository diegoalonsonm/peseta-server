import nodemailer from 'nodemailer';
import { config } from "dotenv";

config()

const passwordRevoceryEmail = ({object}) => {
    return `
        <div>
            <h1>Thanks for using Cash Controller</h1>
            <p>Your password was succesfully changed</p>
            <p>Your password is the following: ${object.password}</p>
            <br>
            <p>If there are any mistakes feel free to contact us!</p>
            <p>Best regards, Cash Controller Team</p>
        </div>
    `
}

const transporter = nodemailer.createTransport({
    pool: true,
    service: 'gmail',
    port: 587,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    maxConnections: 5
})

export const sendRecoveryEmail = async ({object}) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: object.email,
        subject: 'Password Recovery',
        html: passwordRevoceryEmail({object})
    }

    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.error('Error sending email:', err)
                reject(err)
            } else {
                console.log('Email sent successfully:', info.response)
                resolve(info)
            }
        })
    })
}