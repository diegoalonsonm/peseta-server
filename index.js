import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import userRouter from './Routes/userRouter.js';
import { db } from './Models/database/db.js';
import bodyParser from 'body-parser';
import expenseRouter from './Routes/expenseRouter.js';
import incomeRouter from './Routes/incomeRouter.js';
import bcrypt from 'bcrypt';
import { config } from 'dotenv';

config();

const PORT = process.env.PORT || 3930

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
        jwt.verify(token, process.env.JWT_SECRET, (err, data) => {
            if (err) {
                return res.status(401).send('Access Denied')
            } else {
                next()
            }
        })
    }
}

app.get('/', verifyToken, (req, res) => {
    return res.status(200).send('Welcome to Cash Controller API')
})

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body
        console.log('Login attempt for email:', email)

        // Fetch user by email only (not password)
        const users = await db.sequelize.query('SELECT * FROM users WHERE email = :email', {
            replacements: { email },
            type: db.sequelize.QueryTypes.SELECT,
        })

        if (users.length === 0) {
            console.log('User not found:', email)
            return res.status(401).send('Invalid credentials')
        }

        const user = users[0]
        console.log('User found, verifying password...')

        // Compare hashed password
        const validPassword = await bcrypt.compare(password, user.password)
        console.log('Password valid:', validPassword)

        if (!validPassword) {
            console.log('Invalid password for user:', email)
            return res.status(401).send('Invalid credentials')
        }

        // Sign token with user data (don't include password)
        const token = jwt.sign({ email: user.email, id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' })
        res.cookie('token', token, { httpOnly: true })
        console.log('Login successful for:', email)
        return res.status(200).send('Login successful')
    } catch (err) {
        console.error('Login error:', err)
        return res.status(500).send('Internal Server Error')
    }
})

app.get('/logout', (req, res) => {
    res.clearCookie('token')
    return res.status(200).send('Logged out')
})

app.listen(PORT, () => {
})