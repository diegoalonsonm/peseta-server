import { db } from './database/db.js';
import { sendRecoveryEmail } from './nodemailer/index.js';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

export class UserModel {
    static async getAll() {
        const users = await db.sequelize.query('SELECT * FROM users', { type: db.sequelize.QueryTypes.SELECT })
        return users
    }

    static async getOneById({email}) {
        const user = await db.sequelize.query('SELECT * FROM users WHERE email = :email', {
            replacements: { email },
            type: db.sequelize.QueryTypes.SELECT
        })
        return user
    }

    static async getUserIdByEmail({email}) {
        const user = await db.sequelize.query('SELECT id FROM users WHERE email = :email', {
            replacements: { email },
            type: db.sequelize.QueryTypes.SELECT
        })
        return user.length > 0 ? user[0].id : null
    }

    static async checkEmailExists({email}) {
        const user = await db.sequelize.query('SELECT * FROM users WHERE email = :email', {
            replacements: { email },
            type: db.sequelize.QueryTypes.SELECT
        })
        return user.length > 0
    }

    static async createNewUser({user}) {
        try {
            const { name, lastName, email, password } = user

            // Generate UUID for new user
            const id = randomUUID()

            // Hash password before storing
            const saltRounds = 10
            const hashedPassword = await bcrypt.hash(password, saltRounds)

            const newUser = await db.sequelize.query('INSERT INTO users (id, name, lastName, email, password, availableBudget) VALUES (:id, :name, :lastName, :email, :password, 0.0)', {
                replacements: { id, name, lastName, email, password: hashedPassword },
                type: db.sequelize.QueryTypes.INSERT
            })

            console.log('User created successfully:', email, 'with ID:', id)
            return newUser
        } catch (err) {
            console.error('Error creating user:', err)
            throw err
        }
    }

    static async resetPassword({user}) {
        try {
            const { email, password } = user

            // Hash new password before storing
            const saltRounds = 10
            const hashedPassword = await bcrypt.hash(password, saltRounds)

            const userReset = await db.sequelize.query('UPDATE users SET password = :password WHERE email = :email', {
                replacements: { password: hashedPassword, email },
                type: db.sequelize.QueryTypes.UPDATE
            })

            console.log('Password updated in database for:', email)

            // Send plain text password to user via email (they'll need to change it later)
            await sendRecoveryEmail({object: {email, password}})

            return userReset
        } catch (err) {
            console.error('Error in resetPassword:', err)
            throw err
        }
    }

    static async getBalance({email}) {
        try {
            // First get userId from email
            const userId = await this.getUserIdByEmail({email})

            if (!userId) {
                throw new Error('User not found')
            }

            const incomeResult = await db.sequelize.query('SELECT SUM(amount) FROM income WHERE userId = :userId AND active = true', {
                replacements: { userId },
                type: db.sequelize.QueryTypes.SELECT
            })

            const expenseResult = await db.sequelize.query('SELECT SUM(amount) FROM expense WHERE userId = :userId AND active = true', {
                replacements: { userId },
                type: db.sequelize.QueryTypes.SELECT
            })

            const balanceResult = await db.sequelize.query('SELECT availableBudget FROM users WHERE id = :userId', {
                replacements: { userId },
                type: db.sequelize.QueryTypes.SELECT
            })

            const incomeAmount = Number(incomeResult[0]['SUM(amount)']) || 0
            const expenseAmount = Number(expenseResult[0]['SUM(amount)']) || 0
            const balance = Number(balanceResult[0].availableBudget) || 0

            const totalBalance = balance + incomeAmount - expenseAmount
            return totalBalance
        } catch (err) {
            console.error('Error getting balance:', err)
            throw err
        }
    }

    static async updateUserInfo({user}) {
        try {
            const { name, lastName, email, password } = user

            // If password is being updated, hash it
            let hashedPassword = password
            if (password) {
                const saltRounds = 10
                hashedPassword = await bcrypt.hash(password, saltRounds)
            }

            const updatedUser = await db.sequelize.query('UPDATE users SET name = :name, lastName = :lastName, password = :password WHERE email = :email', {
                replacements: { name, lastName, email, password: hashedPassword },
                type: db.sequelize.QueryTypes.UPDATE
            })

            console.log('User info updated successfully:', email)
            return updatedUser
        } catch (err) {
            console.error('Error updating user info:', err)
            throw err
        }
    }
}