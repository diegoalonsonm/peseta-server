import { IncomeModel } from "../Models/incomeModel.js";
import { UserModel } from "../Models/userModel.js";

export class IncomeController {
    static async getAllFromUser(req, res) {
        try {
            const email = req.params.email
            const userId = await UserModel.getUserIdByEmail({email})

            if (!userId) {
                return res.status(404).send('User not found')
            }

            const incomes = await IncomeModel.getAllFromUser({userId})
            res.json(incomes)
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

            const incomes = await IncomeModel.getLastFiveFromUser({userId})
            res.json(incomes)
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

            const totalAmount = await IncomeModel.getTotalAmountFromUser({userId})
            res.json(totalAmount)
        } catch (err) {
            res.status(500).send('error: ' + err.message)
        }
    }

    static async addIncome(req, res) {
        try {
            const { email, amount, description, category } = req.body
            const userId = await UserModel.getUserIdByEmail({email})

            if (!userId) {
                return res.status(404).send('User not found')
            }

            const date = new Date().toISOString().split('T')[0]
            const income = await IncomeModel.addIncome({userId, amount, description, date, category})
            res.json(income)
        } catch (err) {
            res.status(500).send('error: ' + err.message)
        }
    }

    static async getMonthlyIncome(req, res) {
        try {
            const email = req.params.email
            const year = req.query.year ? parseInt(req.query.year) : undefined
            const userId = await UserModel.getUserIdByEmail({email})

            if (!userId) {
                return res.status(404).send('User not found')
            }

            const monthlyIncome = await IncomeModel.getMonthlyIncome({userId, year})
            res.json(monthlyIncome)
        } catch (err) {
            res.status(500).send('error: ' + err.message)
        }
    }

    static async deleteIncome(req, res) {
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

            const result = await IncomeModel.softDeleteIncome({id, userId})

            if (!result.success) {
                return res.status(404).send(result.message)
            }

            res.json({ success: true, message: result.message })
        } catch (err) {
            res.status(500).send('error: ' + err.message)
        }
    }
}