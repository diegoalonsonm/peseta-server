import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import userRouter from './Routes/userRouter.js';
import { db } from './Models/database/db.js';
import bodyParser from 'body-parser';
import expenseRouter from './Routes/expenseRouter.js';
import incomeRouter from './Routes/incomeRouter.js';

const PORT = 3930 

const app = express()

app.use(express.json())
app.use(cors({
    origin: ['http://localhost:3000', 'https://cash-controller-client.vercel.app'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}))
app.disable('x-powered-by')
app.use(cookieParser())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use('/users', userRouter)
app.use('/expenses', expenseRouter)
app.use('/incomes', incomeRouter)

const verifyToken = (req, res, next) => {
    const token = req.cookies.token
    if (!token) {
        return res.status(401).send('Access Denied')
    } else {
        jwt.verify(token, 'secret', (err, data) => {
            if (err) {
                return res.status(401).send('Access Denied')
            } else {
                return res.status(200).send('Access Granted')
                next()
            }
        })
    }
}

app.get('/', verifyToken, (req, res) => {
    return res.status(200)
})

app.post('/login', (req, res) => {
    const { email, password, id } = req.body

    db.sequelize.query('SELECT * FROM users WHERE email = :email AND password = :password', {
        replacements: { email, password },
        type: db.sequelize.QueryTypes.SELECT,
    }).then(user => { 
        if (user.length > 0) {
            const token = jwt.sign({ email, password, id }, 'secret', { expiresIn: '1h' })
            res.cookie('token', token, { httpOnly: true })
            return res.status(200).send('Login successful')
        } else {
            return res.status(401).send('Invalid credentials')
        }
    }).catch(err => {
        console.log(err)
        return res.status(500).send('Internal Server Error')
    })
})

app.get('/logout', (req, res) => {
    res.clearCookie('token')
    return res.status(200).send('Logged out')
})

app.listen(PORT, () => {
    console.log('Server is running on port ' + PORT)
})