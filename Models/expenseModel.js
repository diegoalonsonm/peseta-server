import { db } from "./database/db.js";
import { randomUUID } from 'crypto';

export class ExpenseModel {
    static async getAllFromUser({userId}) {
        const expenses = await db.sequelize.query('SELECT * FROM expense WHERE userId = :userId AND active = true order by date desc', {
            replacements: { userId },
            type: db.sequelize.QueryTypes.SELECT
        })
        return expenses
    }

    static async getLastFiveFromUser({userId}) {
        const expenses = await db.sequelize.query('SELECT * FROM expense WHERE userId = :userId AND active = true order by date desc limit 5', {
            replacements: { userId },
            type: db.sequelize.QueryTypes.SELECT
        })
        return expenses
    }

    static async getTotalAmountFromUser({userId}) {
        const totalAmount =  await db.sequelize.query('SELECT SUM(amount) as totalAmount FROM expense WHERE userId = :userId AND active = true', {
            replacements: { userId },
            type: db.sequelize.QueryTypes.SELECT
        })
        return totalAmount
    }

    static async addExpense({userId, amount, description, date, category}) {
        try {
            // Generate UUID for new expense
            const id = randomUUID()

            const expense = await db.sequelize.query('INSERT INTO expense (id, description, categoryId, amount, date, userId, active) VALUES (:id, :description, :category, :amount, :date, :userId, true)', {
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

    static async getAmountByCategory({userId, year}) {
        const currentYear = year || new Date().getFullYear()
        const categoryAmounts = await db.sequelize.query(
            `SELECT c.description, SUM(e.amount) as totalAmount
             FROM expense e
             JOIN category c ON e.categoryId = c.id
             WHERE e.userId = :userId AND YEAR(e.date) = :year AND e.active = true
             GROUP BY e.categoryId, c.description
             ORDER BY totalAmount DESC`,
            {
                replacements: { userId, year: currentYear },
                type: db.sequelize.QueryTypes.SELECT
            }
        )
        return categoryAmounts
    }

    static async getTop5Categories({userId, year}) {
        const currentYear = year || new Date().getFullYear()
        const top5 = await db.sequelize.query(
            `SELECT c.description, SUM(e.amount) as totalAmount
             FROM expense e
             JOIN category c ON e.categoryId = c.id
             WHERE e.userId = :userId AND YEAR(e.date) = :year AND e.active = true
             GROUP BY e.categoryId, c.description
             ORDER BY totalAmount DESC
             LIMIT 5`,
            {
                replacements: { userId, year: currentYear },
                type: db.sequelize.QueryTypes.SELECT
            }
        )
        return top5
    }

    static async getMonthlyExpense({userId, year}) {
        const currentYear = year || new Date().getFullYear()
        const monthlyData = await db.sequelize.query(
            `SELECT MONTH(date) as month, SUM(amount) as totalAmount
             FROM expense
             WHERE userId = :userId AND YEAR(date) = :year AND active = true
             GROUP BY MONTH(date)
             ORDER BY MONTH(date)`,
            {
                replacements: { userId, year: currentYear },
                type: db.sequelize.QueryTypes.SELECT
            }
        )

        // Fill in missing months with 0
        const result = Array(12).fill(0)
        monthlyData.forEach(item => {
            result[item.month - 1] = parseFloat(item.totalAmount)
        })

        return result
    }

    static async softDeleteExpense({id, userId}) {
        try {
            const expense = await db.sequelize.query(
                'UPDATE expense SET active = false WHERE id = :id AND userId = :userId AND active = true',
                {
                    replacements: { id, userId },
                    type: db.sequelize.QueryTypes.UPDATE
                }
            )

            // Check if any rows were affected (expense[0] is affected rows count for UPDATE)
            if (expense[0] === 0) {
                return { success: false, message: 'Expense not found or already deleted' }
            }

            console.log('Expense soft deleted successfully:', id)
            return { success: true, message: 'Expense deleted successfully' }
        } catch (err) {
            console.error('Error soft deleting expense:', err)
            throw err
        }
    }

    static async getExpenseById({id, userId}) {
        try {
            const expense = await db.sequelize.query(
                'SELECT * FROM expense WHERE id = :id AND userId = :userId AND active = true',
                {
                    replacements: { id, userId },
                    type: db.sequelize.QueryTypes.SELECT
                }
            )
            return expense.length > 0 ? expense[0] : null
        } catch (err) {
            console.error('Error getting expense by ID:', err)
            throw err
        }
    }

    static async updateExpense({id, userId, amount, description, category, date}) {
        try {
            const updates = []
            const replacements = { id, userId }

            if (amount !== undefined && amount !== null) {
                updates.push('amount = :amount')
                replacements.amount = amount
            }

            if (description !== undefined && description !== null) {
                updates.push('description = :description')
                replacements.description = description
            }

            if (category !== undefined && category !== null) {
                updates.push('categoryId = :category')
                replacements.category = category
            }

            if (date !== undefined && date !== null) {
                updates.push('date = :date')
                replacements.date = date
            }

            if (updates.length === 0) {
                return { success: false, message: 'No fields to update' }
            }

            const query = `UPDATE expense SET ${updates.join(', ')} WHERE id = :id AND userId = :userId AND active = true`
            const result = await db.sequelize.query(query, {
                replacements,
                type: db.sequelize.QueryTypes.UPDATE
            })

            if (result[0] === 0) {
                return { success: false, message: 'Expense not found or already deleted' }
            }

            console.log('Expense updated successfully:', id)
            return { success: true, message: 'Expense updated successfully' }
        } catch (err) {
            console.error('Error updating expense:', err)
            throw err
        }
    }
}