import { db } from "./database/db.js";
import { randomUUID } from 'crypto';

export class IncomeModel {
    static async getAllFromUser({userId}) {
        const incomes = await db.sequelize.query('SELECT * FROM income WHERE userId = :userId order by date desc', {
            replacements: { userId },
            type: db.sequelize.QueryTypes.SELECT
        })
        return incomes
    }

    static async getLastFiveFromUser({userId}) {
        const incomes = await db.sequelize.query('SELECT * FROM income WHERE userId = :userId order by date desc limit 5', {
            replacements: { userId },
            type: db.sequelize.QueryTypes.SELECT
        })
        return incomes
    }

    static async getTotalAmountFromUser({userId}) {
        const totalAmount =  await db.sequelize.query('SELECT SUM(amount) as totalAmount FROM income WHERE userId = :userId', {
            replacements: { userId },
            type: db.sequelize.QueryTypes.SELECT
        })
        return totalAmount
    }

    static async addIncome({userId, amount, description, date, category}) {
        try {
            // Generate UUID for new income
            const id = randomUUID()

            const income = await db.sequelize.query('INSERT INTO income (id, description, categoryId, amount, date, userId) VALUES (:id, :description, :category, :amount, :date, :userId)', {
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

    static async getEveryMonthIncome({email}) {
        let allMonthsIncome = []

        for (let i = 1; i <= 12; i++) {
            const monthIncome = await db.sequelize.query('SELECT SUM(amount) FROM income WHERE userEmail = :email AND MONTH(date) = :month', {
                replacements: { email, month: i }, type: db.sequelize.QueryTypes.SELECT
            }).then(result => {
                return Number(result[0] && result[0]['SUM(amount)'] ? result[0]['SUM(amount)'] : 0)
            }).catch(err => {
                console.log(err.message)
            })
            
            allMonthsIncome.push(monthIncome)
        }    
        
        return allMonthsIncome        
    }
}