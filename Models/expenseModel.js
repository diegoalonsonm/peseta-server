import { db } from "./database/db.js";
import { randomUUID } from 'crypto';

export class ExpenseModel {
    static async getAllFromUser({userId}) {
        const expenses = await db.sequelize.query('SELECT * FROM expense WHERE userId = :userId order by date desc', {
            replacements: { userId },
            type: db.sequelize.QueryTypes.SELECT
        })
        return expenses
    }

    static async getLastFiveFromUser({userId}) {
        const expenses = await db.sequelize.query('SELECT * FROM expense WHERE userId = :userId order by date desc limit 5', {
            replacements: { userId },
            type: db.sequelize.QueryTypes.SELECT
        })
        return expenses
    }

    static async getTotalAmountFromUser({userId}) {
        const totalAmount =  await db.sequelize.query('SELECT SUM(amount) as totalAmount FROM expense WHERE userId = :userId', {
            replacements: { userId },
            type: db.sequelize.QueryTypes.SELECT
        })
        return totalAmount
    }

    static async addExpense({userId, amount, description, date, category}) {
        try {
            // Generate UUID for new expense
            const id = randomUUID()

            const expense = await db.sequelize.query('INSERT INTO expense (id, description, categoryId, amount, date, userId) VALUES (:id, :description, :category, :amount, :date, :userId)', {
                replacements: { id, description, category, amount, date, userId },
                type: db.sequelize.QueryTypes.INSERT
            })

            console.log('Expense created successfully with ID:', id)
            return expense
        } catch (err) {
            console.error('Error creating expense:', err)
            throw err
        }
    }

    static async getEveryMonthExpense({email}) {
        let allMonthsExpense = []

        for (let i = 1; i <= 12; i++) {
            const monthExpense = await db.sequelize.query('SELECT SUM(amount) FROM expense WHERE userEmail = :email AND MONTH(date) = :month', {
                replacements: { email, month: i }, type: db.sequelize.QueryTypes.SELECT
            }).then(result => {
                return Number(result[0] && result[0]['SUM(amount)'] ? result[0]['SUM(amount)'] : 0)
            }).catch(err => {
                console.log(err.message)
            })
            
            allMonthsExpense.push(monthExpense)
        }    
        
        return allMonthsExpense        
    }

    static async getTop5Categories({email}) {
        const top5Categories = await db.sequelize.query('SELECT category.description, SUM(expense.amount) as totalAmount FROM expense INNER JOIN category ON expense.categoryId = category.id WHERE userEmail = :email GROUP BY category.description ORDER BY totalAmount DESC LIMIT 5', {
            replacements: { email },
            type: db.sequelize.QueryTypes.SELECT
        })
        return top5Categories
    }

    static async getExpenseAmountByCategory({email}) {
        const expenseAmountByCategory = await db.sequelize.query('SELECT category.description, SUM(expense.amount) as totalAmount FROM expense INNER JOIN category ON expense.categoryId = category.id WHERE userEmail = :email GROUP BY category.description ORDER BY totalAmount DESC', {
            replacements: { email },
            type: db.sequelize.QueryTypes.SELECT
        })
        return expenseAmountByCategory
    }
}