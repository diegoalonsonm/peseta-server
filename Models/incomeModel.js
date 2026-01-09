import { db } from "./database/db.js";
import { randomUUID } from 'crypto';

export class IncomeModel {
    static async getAllFromUser({userId}) {
        const incomes = await db.sequelize.query('SELECT * FROM income WHERE userId = :userId AND active = true order by date desc', {
            replacements: { userId },
            type: db.sequelize.QueryTypes.SELECT
        })
        return incomes
    }

    static async getLastFiveFromUser({userId}) {
        const incomes = await db.sequelize.query('SELECT * FROM income WHERE userId = :userId AND active = true order by date desc limit 5', {
            replacements: { userId },
            type: db.sequelize.QueryTypes.SELECT
        })
        return incomes
    }

    static async getTotalAmountFromUser({userId}) {
        const totalAmount =  await db.sequelize.query('SELECT SUM(amount) as totalAmount FROM income WHERE userId = :userId AND active = true', {
            replacements: { userId },
            type: db.sequelize.QueryTypes.SELECT
        })
        return totalAmount
    }

    static async addIncome({userId, amount, description, date, category}) {
        try {
            // Generate UUID for new income
            const id = randomUUID()

            const income = await db.sequelize.query('INSERT INTO income (id, description, categoryId, amount, date, userId, active) VALUES (:id, :description, :category, :amount, :date, :userId, true)', {
                replacements: { id, description, category, amount, date, userId },
                type: db.sequelize.QueryTypes.INSERT
            })

            console.log('Income created successfully with ID:', id)
            return income
        } catch (err) {
            console.error('Error creating income:', err)
            throw err
        }
    }

    static async getMonthlyIncome({userId, year}) {
        const currentYear = year || new Date().getFullYear()
        const monthlyData = await db.sequelize.query(
            `SELECT MONTH(date) as month, SUM(amount) as totalAmount
             FROM income
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

    static async softDeleteIncome({id, userId}) {
        try {
            const income = await db.sequelize.query(
                'UPDATE income SET active = false WHERE id = :id AND userId = :userId AND active = true',
                {
                    replacements: { id, userId },
                    type: db.sequelize.QueryTypes.UPDATE
                }
            )

            // Check if any rows were affected
            if (income[0] === 0) {
                return { success: false, message: 'Income not found or already deleted' }
            }

            console.log('Income soft deleted successfully:', id)
            return { success: true, message: 'Income deleted successfully' }
        } catch (err) {
            console.error('Error soft deleting income:', err)
            throw err
        }
    }

    static async getIncomeById({id, userId}) {
        try {
            const income = await db.sequelize.query(
                'SELECT * FROM income WHERE id = :id AND userId = :userId AND active = true',
                {
                    replacements: { id, userId },
                    type: db.sequelize.QueryTypes.SELECT
                }
            )
            return income.length > 0 ? income[0] : null
        } catch (err) {
            console.error('Error getting income by ID:', err)
            throw err
        }
    }

    static async updateIncome({id, userId, amount, description, category, date}) {
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

            const query = `UPDATE income SET ${updates.join(', ')} WHERE id = :id AND userId = :userId AND active = true`
            const result = await db.sequelize.query(query, {
                replacements,
                type: db.sequelize.QueryTypes.UPDATE
            })

            if (result[0] === 0) {
                return { success: false, message: 'Income not found or already deleted' }
            }

            console.log('Income updated successfully:', id)
            return { success: true, message: 'Income updated successfully' }
        } catch (err) {
            console.error('Error updating income:', err)
            throw err
        }
    }
}