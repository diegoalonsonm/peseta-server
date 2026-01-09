import nodemailer from 'nodemailer';
import { config } from "dotenv";

config()

const passwordRevoceryEmail = ({object}) => {
    return `
        <div>
            <h1>Gracias por usar Peseta</h1>
            <p>Tu contraseña ha sido cambiada exitosamente</p>
            <p>Tu contraseña es la siguiente: ${object.password}</p>
            <br>
            <p>Si hay algún error, no dudes en contactarnos!</p>
            <p>Saludos cordiales, Equipo de Peseta</p>
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
        subject: 'Cambio de contraseña',
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