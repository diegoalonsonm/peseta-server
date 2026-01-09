import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import userRouter from './Routes/userRouter.js';
import { db } from './Models/database/db.js';
import bodyParser from 'body-parser';
import expenseRouter from './Routes/expenseRouter.js';
import incomeRouter from './Routes/incomeRouter.js';
import budgetRouter from './Routes/budgetRouter.js';
import bcrypt from 'bcrypt';
import { config } from 'dotenv';

config();

const PORT = process.env.PORT || 3930

const app = express()

app.use(express.json())

// CORS configuration to support multiple origins (comma-separated in env var)
const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : ['http://localhost:3000']

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or Postman)
        if (!origin) return callback(null, true)

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            console.log('Blocked by CORS:', origin)
            callback(new Error('Not allowed by CORS'))
        }
    },
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
app.use('/budgets', budgetRouter)

const verifyToken = (req, res, next) => {
    const token = req.cookies.token
    console.log(token)
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

        // Cookie configuration for mobile browser compatibility
        const isProduction = process.env.NODE_ENV === 'production'
        res.cookie('token', token, {
            httpOnly: true,
            secure: true, // Always use secure in production (required for sameSite: 'none')
            sameSite: isProduction ? 'none' : 'lax',
            maxAge: 3600000, // 1 hour in milliseconds
            path: '/'
        })
        console.log('Login successful for:', email, 'Cookie settings:', { secure: true, sameSite: isProduction ? 'none' : 'lax' })
        return res.status(200).send('Login successful')
    } catch (err) {
        console.error('Login error:', err)
        return res.status(500).send('Internal Server Error')
    }
})

app.get('/logout', (req, res) => {
    const isProduction = process.env.NODE_ENV === 'production'
    res.clearCookie('token', {
        httpOnly: true,
        secure: true, // Must match the cookie settings used when setting the cookie
        sameSite: isProduction ? 'none' : 'lax',
        path: '/'
    })
    return res.status(200).send('Logged out')
})

// Only start server when running locally (not on Vercel)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`)
    })
}

// Export for Vercel serverless function
export default app