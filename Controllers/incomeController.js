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
    
    static async getEveryMonthIncome(req, res) {
        try {
            const email = req.params.email
            const everyMonthIncome = await IncomeModel.getEveryMonthIncome({email})
            res.json(everyMonthIncome)
        } catch (err) {
            res.status(500).send('error: ' + err.message)
        }
    }
}