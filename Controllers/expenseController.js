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

    static async getEveryMonthExpense(req, res) {
        try {
            const email = req.params.email
            const allMonthsExpense = await ExpenseModel.getEveryMonthExpense({email})
            res.json(allMonthsExpense)
        } catch (err) {
            res.status(500).send('error: ' + err.message)
        }
    }

    static async getTop5Categories(req, res) {
        try {
            const email = req.params.email
            const top5Categories = await ExpenseModel.getTop5Categories({email})
            res.json(top5Categories)
        } catch (err) {
            res.status(500).send('error: ' + err.message)
        }
    }

    static async getExpenseAmountByCategory (req, res) {
        try {
            const email = req.params.email
            const expenseAmountByCategory = await ExpenseModel.getExpenseAmountByCategory({email})
            res.json(expenseAmountByCategory)
        } catch (err) {
            res.status(500).send('error: ' + err.message)
        }
    }
}