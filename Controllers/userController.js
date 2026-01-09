import { UserModel } from "../Models/userModel.js"
import { IncomeModel } from "../Models/incomeModel.js"
import { ExpenseModel } from "../Models/expenseModel.js"

export class UserController {
    static async getAll(req, res) {
        try {
            const users = await UserModel.getAll()
            res.json(users) 
        } catch (err) {
            res.status(500).send('error: ' + err.message)
        }
    }

    static async getOne(req, res) {
        try {
            const email = req.params.email
            const user = await UserModel.getOneById({email})
            res.json(user)
        } catch (err) {
            res.status(500).send('error: ' + err.message)
        }
    }

    static async newUser(req, res) {
        try {
            const user = req.body

            if (user.error) return res.status(400).json({ error: JSON.parse(user.error.message) })

            const emailExists = await UserModel.checkEmailExists({email: user.email})
            
            if (emailExists) return res.status(409).json({ error: 'Email already exists' })

            const newUser = await UserModel.createNewUser({user})
            res.json(newUser)
        } catch (err) {
            res.status(500).send('error: ' + err.message)
        }
    }

    static async resetPassword(req, res) {
        try {
            const generateRandomPassword = () => {
                const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
                let password = '';
                for (let i = 0; i < 8; i++) {
                    password += characters.charAt(Math.floor(Math.random() * characters.length));
                }
                return password;
            }

            const email = req.body.email
            const password = generateRandomPassword()

            if (email.error) return res.status(400).json({ error: JSON.parse(email.error.message) })
            
            const user = {password, email}

            const userReset = await UserModel.resetPassword({user})
            res.json(userReset)        
        } catch (err) {
            res.status(500).send('error: ' + err.message)
        }
    }

    static async getBalance(req, res) {
        try {
            const email = req.params.email
            const balance = await UserModel.getBalance({email})
            res.json(balance)
        } catch (err) {
            res.status(500).send('error: ' + err.message)
        }
    }

    static async updateBalance(req, res) {
        try {
            const email = req.params.email
            const balance = await this.getBalance()
            const incomes = IncomeModel.getAllIncomes(email)
            const expenses = ExpenseModel.getAllExpenses(email)

            const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0)
            const totalExpense = expenses.reduce((sum, expense) => sum + expense.amount, 0)

            balance += totalIncome - totalExpense

            const updatedBalance = await UserModel.updateBalance({email, balance})
            res.json(updatedBalance)
        } catch (err) {
            res.status(500).send('error: ' + err.message)
        }
    }

    static async updateUserInfo(req, res) {
        try {
            const email = req.params.email
            const { name, lastName, password } = req.body

            // Validate inputs if provided
            if (name !== undefined && name !== null && name !== '') {
                if (name.trim().length < 2) {
                    return res.status(400).json({
                        error: 'El nombre debe tener al menos 2 caracteres'
                    })
                }
            }

            if (lastName !== undefined && lastName !== null && lastName !== '') {
                if (lastName.trim().length < 2) {
                    return res.status(400).json({
                        error: 'El apellido debe tener al menos 2 caracteres'
                    })
                }
            }

            if (password !== undefined && password !== null && password !== '') {
                if (password.length < 6) {
                    return res.status(400).json({
                        error: 'La contraseña debe tener al menos 6 caracteres'
                    })
                }
            }

            // Check if user exists
            const userExists = await UserModel.getOneById({email})
            if (!userExists || userExists.length === 0) {
                return res.status(404).json({ error: 'Usuario no encontrado' })
            }

            // Only pass provided fields to model
            const user = { email }
            if (name !== undefined && name !== null && name !== '') user.name = name
            if (lastName !== undefined && lastName !== null && lastName !== '') user.lastName = lastName
            if (password !== undefined && password !== null && password !== '') user.password = password

            const updatedUser = await UserModel.updateUserInfo({user})
            res.json({
                success: true,
                message: 'Perfil actualizado correctamente',
                updatedUser
            })
        } catch (err) {
            res.status(500).send('error: ' + err.message)
        }
    }
}