import { db } from './database/db.js';
import { randomUUID } from 'crypto';

/**
 * Format date to YYYY-MM-DD using local time (avoids timezone issues)
 * @param {Date} date - JavaScript Date object
 * @returns {string} Date string in YYYY-MM-DD format
 */
function formatDateLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Calculate end date based on start date and period type
 * @param {string} startDate - ISO date string (YYYY-MM-DD)
 * @param {string} periodType - 'weekly', 'biweekly', or 'monthly'
 * @returns {string} End date in YYYY-MM-DD format
 */
function calculateEndDate(startDate, periodType) {
    const [year, month, day] = startDate.split('-').map(Number);
    const start = new Date(year, month - 1, day);
    let end;

    switch(periodType) {
        case 'weekly':
            // End date is 6 days after start (total 7-day period)
            end = new Date(start);
            end.setDate(end.getDate() + 6);
            break;

        case 'biweekly':
            // End date is 13 days after start (total 14-day period)
            end = new Date(start);
            end.setDate(end.getDate() + 13);
            break;

        case 'monthly':
            // End date is the last day of the month containing start date
            end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
            break;

        default:
            throw new Error(`Invalid period type: ${periodType}`);
    }

    return formatDateLocal(end);
}

export class BudgetModel {
    /**
     * Get total spending in current period for a specific category
     * @param {Object} params
     * @param {string} params.userId - User UUID
     * @param {number} params.categoryId - Category ID
     * @param {Date} params.periodStart - Period start date
     * @param {Date} params.periodEnd - Period end date
     * @returns {number} Total amount spent
     */
    static async getCurrentPeriodSpending({ userId, categoryId, periodStart, periodEnd }) {
        try {
            // Format dates as YYYY-MM-DD for SQL
            const startStr = formatDateLocal(periodStart);
            const endStr = formatDateLocal(periodEnd);

            const spending = await db.sequelize.query(
                `SELECT COALESCE(SUM(amount), 0) as totalSpent
                 FROM expense
                 WHERE userId = :userId
                 AND categoryId = :categoryId
                 AND date BETWEEN :periodStart AND :periodEnd
                 AND active = true`,
                {
                    replacements: { userId, categoryId, periodStart: startStr, periodEnd: endStr },
                    type: db.sequelize.QueryTypes.SELECT
                }
            );

            return parseFloat(spending[0].totalSpent) || 0;
        } catch (err) {
            console.error('Error getting current period spending:', err);
            throw err;
        }
    }

    /**
     * Check if a budget period has expired and restart it if needed
     * @param {Object} budget - Budget object with startDate, endDate, and periodType
     * @returns {Object|null} Updated dates if restart happened, null otherwise
     */
    static restartExpiredBudgetIfNeeded(budget) {
        // Parse endDate to check if it has passed
        const [endYear, endMonth, endDay] = budget.endDate.split('-').map(Number);
        const endDate = new Date(endYear, endMonth - 1, endDay);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // If endDate hasn't passed yet, no restart needed
        if (endDate >= today) {
            return null;
        }

        // Budget period has expired - calculate new period
        // New start date is 1 day after old end date
        const newStart = new Date(endDate);
        newStart.setDate(newStart.getDate() + 1);
        const newStartDate = formatDateLocal(newStart);

        // Calculate new end date based on period type
        const newEndDate = calculateEndDate(newStartDate, budget.periodType);

        return {
            startDate: newStartDate,
            endDate: newEndDate
        };
    }

    /**
     * Update budget dates in database after restart
     * @param {string} budgetId - Budget UUID
     * @param {string} startDate - New start date
     * @param {string} endDate - New end date
     */
    static async updateBudgetDates(budgetId, startDate, endDate) {
        try {
            await db.sequelize.query(
                `UPDATE budget SET startDate = :startDate, endDate = :endDate, updatedAt = CURRENT_TIMESTAMP
                 WHERE id = :budgetId`,
                {
                    replacements: { budgetId, startDate, endDate },
                    type: db.sequelize.QueryTypes.UPDATE
                }
            );
            console.log('Budget dates updated for restart:', budgetId);
        } catch (err) {
            console.error('Error updating budget dates:', err);
            throw err;
        }
    }

    /**
     * Create a new budget
     * @param {Object} params
     * @param {string} params.userId - User UUID
     * @param {number} params.categoryId - Category ID
     * @param {number} params.limitAmount - Budget limit amount
     * @param {string} params.periodType - 'weekly', 'biweekly', or 'monthly'
     * @param {string} params.startDate - ISO date string (YYYY-MM-DD)
     * @returns {Object} Created budget
     */
    static async createBudget({ userId, categoryId, limitAmount, periodType, startDate }) {
        try {
            const id = randomUUID();

            // Calculate end date based on period type
            const endDate = calculateEndDate(startDate, periodType);

            await db.sequelize.query(
                `INSERT INTO budget (id, userId, categoryId, limitAmount, periodType, startDate, endDate, active)
                 VALUES (:id, :userId, :categoryId, :limitAmount, :periodType, :startDate, :endDate, true)`,
                {
                    replacements: { id, userId, categoryId, limitAmount, periodType, startDate, endDate },
                    type: db.sequelize.QueryTypes.INSERT
                }
            );

            console.log('Budget created successfully:', id);

            // Return the created budget
            const budget = await db.sequelize.query(
                'SELECT * FROM budget WHERE id = :id',
                {
                    replacements: { id },
                    type: db.sequelize.QueryTypes.SELECT
                }
            );

            return budget[0];
        } catch (err) {
            console.error('Error creating budget:', err);
            throw err;
        }
    }

    /**
     * Get all budgets for a user (without spending calculations)
     * @param {Object} params
     * @param {string} params.userId - User UUID
     * @returns {Array} Array of budgets
     */
    static async getAllBudgetsForUser({ userId }) {
        try {
            const budgets = await db.sequelize.query(
                `SELECT b.*, c.description as categoryName
                 FROM budget b
                 JOIN category c ON b.categoryId = c.id
                 WHERE b.userId = :userId AND b.active = true
                 ORDER BY c.description`,
                {
                    replacements: { userId },
                    type: db.sequelize.QueryTypes.SELECT
                }
            );

            return budgets;
        } catch (err) {
            console.error('Error getting budgets:', err);
            throw err;
        }
    }

    /**
     * Get budget for a specific category
     * @param {Object} params
     * @param {string} params.userId - User UUID
     * @param {number} params.categoryId - Category ID
     * @returns {Object|null} Budget or null if not found
     */
    static async getBudgetByCategory({ userId, categoryId }) {
        try {
            const budget = await db.sequelize.query(
                `SELECT b.*, c.description as categoryName
                 FROM budget b
                 JOIN category c ON b.categoryId = c.id
                 WHERE b.userId = :userId AND b.categoryId = :categoryId AND b.active = true
                 LIMIT 1`,
                {
                    replacements: { userId, categoryId },
                    type: db.sequelize.QueryTypes.SELECT
                }
            );

            if (budget.length === 0) {
                return null;
            }

            // Parse stored dates into Date objects for spending query
            const [startYear, startMonth, startDay] = budget[0].startDate.split('-').map(Number);
            const [endYear, endMonth, endDay] = budget[0].endDate.split('-').map(Number);
            const periodStart = new Date(startYear, startMonth - 1, startDay);
            const periodEnd = new Date(endYear, endMonth - 1, endDay);

            const totalSpent = await this.getCurrentPeriodSpending({
                userId,
                categoryId: budget[0].categoryId,
                periodStart,
                periodEnd
            });

            const remaining = budget[0].limitAmount - totalSpent;
            const percentUsed = (totalSpent / budget[0].limitAmount) * 100;

            return {
                ...budget[0],
                totalSpent,
                remaining,
                percentUsed,
                periodStart: budget[0].startDate,  // Already in YYYY-MM-DD format
                periodEnd: budget[0].endDate,      // Already in YYYY-MM-DD format
                isOverBudget: totalSpent > budget[0].limitAmount,
                isNearLimit: percentUsed >= 80 && percentUsed < 100
            };
        } catch (err) {
            console.error('Error getting budget by category:', err);
            throw err;
        }
    }

    /**
     * Get all budgets with current period spending calculations
     * THIS IS THE MOST IMPORTANT METHOD - used by frontend to display budgets
     * @param {Object} params
     * @param {string} params.userId - User UUID
     * @returns {Array} Array of budgets with spending metrics
     */
    static async getAllBudgetsWithSpending({ userId }) {
        try {
            // Fetch all active budgets for user with category names
            const budgets = await this.getAllBudgetsForUser({ userId });

            // Calculate current period spending for each budget
            const budgetsWithSpending = await Promise.all(
                budgets.map(async (budget) => {
                    // Parse stored dates into Date objects for spending query
                    const [startYear, startMonth, startDay] = budget.startDate.split('-').map(Number);
                    const [endYear, endMonth, endDay] = budget.endDate.split('-').map(Number);
                    const periodStart = new Date(startYear, startMonth - 1, startDay);
                    const periodEnd = new Date(endYear, endMonth - 1, endDay);

                    // Get spending in current period
                    const totalSpent = await this.getCurrentPeriodSpending({
                        userId,
                        categoryId: budget.categoryId,
                        periodStart,
                        periodEnd
                    });

                    // Calculate metrics
                    const remaining = budget.limitAmount - totalSpent;
                    const percentUsed = (totalSpent / budget.limitAmount) * 100;

                    return {
                        ...budget,
                        totalSpent,
                        remaining,
                        percentUsed,
                        periodStart: budget.startDate,  // Already in YYYY-MM-DD format
                        periodEnd: budget.endDate,      // Already in YYYY-MM-DD format
                        isOverBudget: totalSpent > budget.limitAmount,
                        isNearLimit: percentUsed >= 80 && percentUsed < 100
                    };
                })
            );

            return budgetsWithSpending;
        } catch (err) {
            console.error('Error getting budgets with spending:', err);
            throw err;
        }
    }

    /**
     * Update an existing budget
     * @param {Object} params
     * @param {string} params.budgetId - Budget UUID
     * @param {string} params.userId - User UUID (for security)
     * @param {number} [params.limitAmount] - New limit amount
     * @param {string} [params.periodType] - New period type
     * @param {string} [params.startDate] - New start date
     * @param {string} [params.endDate] - New end date
     * @returns {Object} Update result
     */
    static async updateBudget({ budgetId, userId, limitAmount, periodType, startDate, endDate }) {
        try {
            // Build dynamic UPDATE query based on provided fields
            const updates = [];
            const replacements = { budgetId, userId };

            if (limitAmount !== undefined && limitAmount !== null) {
                updates.push('limitAmount = :limitAmount');
                replacements.limitAmount = limitAmount;
            }

            if (periodType !== undefined && periodType !== null) {
                updates.push('periodType = :periodType');
                replacements.periodType = periodType;
            }

            if (startDate !== undefined && startDate !== null) {
                updates.push('startDate = :startDate');
                replacements.startDate = startDate;
            }

            if (endDate !== undefined && endDate !== null) {
                updates.push('endDate = :endDate');
                replacements.endDate = endDate;
            }

            // Always update the updatedAt timestamp
            updates.push('updatedAt = CURRENT_TIMESTAMP');

            if (updates.length === 1) { // Only updatedAt
                console.log('No fields to update for budget:', budgetId);
                return { message: 'No fields to update' };
            }

            // Build and execute dynamic query
            const query = `UPDATE budget SET ${updates.join(', ')} WHERE id = :budgetId AND userId = :userId AND active = true`;

            const result = await db.sequelize.query(query, {
                replacements,
                type: db.sequelize.QueryTypes.UPDATE
            });

            if (result[0] === 0) {
                return { success: false, message: 'Budget not found or already deleted' };
            }

            console.log('Budget updated successfully:', budgetId);
            return { success: true, message: 'Budget updated successfully' };
        } catch (err) {
            console.error('Error updating budget:', err);
            throw err;
        }
    }

    /**
     * Soft delete a budget (set active = false)
     * @param {Object} params
     * @param {string} params.budgetId - Budget UUID
     * @param {string} params.userId - User UUID (for security)
     * @returns {Object} Delete result
     */
    static async softDeleteBudget({ budgetId, userId }) {
        try {
            const result = await db.sequelize.query(
                'UPDATE budget SET active = false WHERE id = :budgetId AND userId = :userId AND active = true',
                {
                    replacements: { budgetId, userId },
                    type: db.sequelize.QueryTypes.UPDATE
                }
            );

            if (result[0] === 0) {
                return { success: false, message: 'Budget not found or already deleted' };
            }

            console.log('Budget soft deleted successfully:', budgetId);
            return { success: true, message: 'Budget deleted successfully' };
        } catch (err) {
            console.error('Error soft deleting budget:', err);
            throw err;
        }
    }

    /**
     * Get budget alerts (budgets that are over limit or near limit)
     * @param {Object} params
     * @param {string} params.userId - User UUID
     * @returns {Object} { totalAlerts, overBudget: [], nearLimit: [] }
     */
    static async getBudgetAlerts({ userId }) {
        try {
            const allBudgets = await this.getAllBudgetsWithSpending({ userId });

            const overBudget = allBudgets.filter(b => b.isOverBudget);
            const nearLimit = allBudgets.filter(b => b.isNearLimit);

            return {
                totalAlerts: overBudget.length + nearLimit.length,
                overBudget,
                nearLimit
            };
        } catch (err) {
            console.error('Error getting budget alerts:', err);
            throw err;
        }
    }
}
