import { ExpenseModel } from "../Models/expenseModel.js";
import { UserModel } from "../Models/userModel.js";

export class ExpenseController {
    static async getAllFromUser(req, res) {
        try {
            const email = req.params.email
            const userId = await UserModel.getUserIdByEmail({email})

            if (!userId) {
                return res.status(404).send('User not found')
            }

            const expenses = await ExpenseModel.getAllFromUser({userId})
            res.json(expenses)
        } catch (err) {
            res.status(500).send('error: ' + err.message)
        }
    }

    static async getLastFiveFromUser(req, res) {
        try {
            const email = req.params.email
            const userId = await UserModel.getUserIdByEmail({email})

            if (!userId) {
                return res.status(404).send('User not found')
            }

            const expenses = await ExpenseModel.getLastFiveFromUser({userId})
            res.json(expenses)
        } catch (err) {
            res.status(500).send('error: ' + err.message)
        }
    }

    static async getTotalAmountFromUser(req, res) {
        try {
            const email = req.params.email
            const userId = await UserModel.getUserIdByEmail({email})

            if (!userId) {
                return res.status(404).send('User not found')
            }

            const totalAmount = await ExpenseModel.getTotalAmountFromUser({userId})
            res.json(totalAmount)
        } catch (err) {
            res.status(500).send('error: ' + err.message)
        }
    }

    static async addExpense(req, res) {
        try {
            const { email, amount, description, category } = req.body
            const userId = await UserModel.getUserIdByEmail({email})

            if (!userId) {
                return res.status(404).send('User not found')
            }

            const date = new Date().toISOString().split('T')[0]
            const expense = await ExpenseModel.addExpense({userId, amount, description, date, category})
            res.json(expense)
        } catch (err) {
            res.status(500).send('error: ' + err.message)
        }
    }

    static async getAmountByCategory(req, res) {
        try {
            const email = req.params.email
            const year = req.query.year ? parseInt(req.query.year) : undefined
            const userId = await UserModel.getUserIdByEmail({email})

            if (!userId) {
                return res.status(404).send('User not found')
            }

            const categoryAmounts = await ExpenseModel.getAmountByCategory({userId, year})
            res.json(categoryAmounts)
        } catch (err) {
            res.status(500).send('error: ' + err.message)
        }
    }

    static async getTop5Categories(req, res) {
        try {
            const email = req.params.email
            const year = req.query.year ? parseInt(req.query.year) : undefined
            const userId = await UserModel.getUserIdByEmail({email})

            if (!userId) {
                return res.status(404).send('User not found')
            }

            const top5 = await ExpenseModel.getTop5Categories({userId, year})
            res.json(top5)
        } catch (err) {
            res.status(500).send('error: ' + err.message)
        }
    }

    static async getMonthlyExpense(req, res) {
        try {
            const email = req.params.email
            const year = req.query.year ? parseInt(req.query.year) : undefined
            const userId = await UserModel.getUserIdByEmail({email})

            if (!userId) {
                return res.status(404).send('User not found')
            }

            const monthlyExpense = await ExpenseModel.getMonthlyExpense({userId, year})
            res.json(monthlyExpense)
        } catch (err) {
            res.status(500).send('error: ' + err.message)
        }
    }

    static async deleteExpense(req, res) {
        try {
            const { id } = req.params
            const email = req.body.email || req.query.email

            if (!email) {
                return res.status(400).send('Email is required')
            }

            const userId = await UserModel.getUserIdByEmail({email})

            if (!userId) {
                return res.status(404).send('User not found')
            }

            const result = await ExpenseModel.softDeleteExpense({id, userId})

            if (!result.success) {
                return res.status(404).send(result.message)
            }

            res.json({ success: true, message: result.message })
        } catch (err) {
            res.status(500).send('error: ' + err.message)
        }
    }
}