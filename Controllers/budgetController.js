import { BudgetModel } from '../Models/budgetModel.js';
import { UserModel } from '../Models/userModel.js';

export class BudgetController {
    /**
     * GET /budgets/:email
     * Get all budgets for a user with current spending calculations
     * Automatically restarts expired budgets
     */
    static async getAllBudgets(req, res) {
        try {
            const email = req.params.email;
            const userId = await UserModel.getUserIdByEmail({ email });

            if (!userId) {
                return res.status(404).send('User not found');
            }

            // Get all budgets (without spending calculations first for restart check)
            const allBudgets = await BudgetModel.getAllBudgetsForUser({ userId });

            // Check each budget and restart if expired
            let restarted = false;
            for (const budget of allBudgets) {
                const newDates = BudgetModel.restartExpiredBudgetIfNeeded(budget);
                if (newDates) {
                    await BudgetModel.updateBudgetDates(budget.id, newDates.startDate, newDates.endDate);
                    restarted = true;
                    console.log(`Budget ${budget.id} restarted: ${newDates.startDate} to ${newDates.endDate}`);
                }
            }

            // Fetch budgets with spending calculations (will use updated dates if restarted)
            const budgets = await BudgetModel.getAllBudgetsWithSpending({ userId });
            res.json(budgets);
        } catch (err) {
            console.error('Error in getAllBudgets:', err);
            res.status(500).send('error: ' + err.message);
        }
    }

    /**
     * GET /budgets/:email/alerts
     * Get budget alerts (over budget or near limit)
     */
    static async getBudgetAlerts(req, res) {
        try {
            const email = req.params.email;
            const userId = await UserModel.getUserIdByEmail({ email });

            if (!userId) {
                return res.status(404).send('User not found');
            }

            const alerts = await BudgetModel.getBudgetAlerts({ userId });
            res.json(alerts);
        } catch (err) {
            console.error('Error in getBudgetAlerts:', err);
            res.status(500).send('error: ' + err.message);
        }
    }

    /**
     * GET /budgets/:email/category/:categoryId
     * Get budget for a specific category
     * Automatically restarts expired budget
     */
    static async getBudgetByCategory(req, res) {
        try {
            const email = req.params.email;
            const categoryId = parseInt(req.params.categoryId);

            if (!categoryId || isNaN(categoryId)) {
                return res.status(400).send('Invalid category ID');
            }

            const userId = await UserModel.getUserIdByEmail({ email });

            if (!userId) {
                return res.status(404).send('User not found');
            }

            let budget = await BudgetModel.getBudgetByCategory({ userId, categoryId });

            if (!budget) {
                return res.status(404).json({ message: 'No budget found for this category' });
            }

            // Check if budget needs restart
            const newDates = BudgetModel.restartExpiredBudgetIfNeeded(budget);
            if (newDates) {
                await BudgetModel.updateBudgetDates(budget.id, newDates.startDate, newDates.endDate);
                console.log(`Budget ${budget.id} restarted: ${newDates.startDate} to ${newDates.endDate}`);
                // Re-fetch budget with updated dates
                budget = await BudgetModel.getBudgetByCategory({ userId, categoryId });
            }

            res.json(budget);
        } catch (err) {
            console.error('Error in getBudgetByCategory:', err);
            res.status(500).send('error: ' + err.message);
        }
    }

    /**
     * POST /budgets
     * Create a new budget
     */
    static async createBudget(req, res) {
        try {
            const { email, categoryId, limitAmount, periodType, startDate } = req.body;

            // Get user ID from email
            const userId = await UserModel.getUserIdByEmail({ email });

            if (!userId) {
                return res.status(404).send('User not found');
            }

            // Validate required fields
            if (!categoryId || !limitAmount || !periodType) {
                return res.status(400).send('Missing required fields: categoryId, limitAmount, periodType');
            }

            // Validate period type
            if (!['weekly', 'biweekly', 'monthly'].includes(periodType)) {
                return res.status(400).send('Invalid period type. Must be: weekly, biweekly, or monthly');
            }

            // Validate limit amount
            if (limitAmount <= 0) {
                return res.status(400).send('Limit amount must be greater than 0');
            }

            // Validate category ID
            if (!Number.isInteger(categoryId) || categoryId < 1) {
                return res.status(400).send('Invalid category ID');
            }

            // Check if budget already exists for this category
            const existingBudget = await BudgetModel.getBudgetByCategory({ userId, categoryId });
            if (existingBudget) {
                return res.status(409).json({
                    error: 'Ya existe un presupuesto activo para esta categoría'
                });
            }

            // Create budget
            const budget = await BudgetModel.createBudget({
                userId,
                categoryId,
                limitAmount,
                periodType,
                startDate: startDate || new Date().toISOString().split('T')[0]
            });

            res.status(201).json(budget);
        } catch (err) {
            console.error('Error in createBudget:', err);
            res.status(500).send('error: ' + err.message);
        }
    }

    /**
     * PUT /budgets/:budgetId
     * Update an existing budget (mid-period adjustment)
     */
    static async updateBudget(req, res) {
        try {
            const { budgetId } = req.params;
            const { email, limitAmount, periodType, startDate, endDate } = req.body;

            if (!email) {
                return res.status(400).send('Email is required');
            }

            const userId = await UserModel.getUserIdByEmail({ email });

            if (!userId) {
                return res.status(404).send('User not found');
            }

            // Validate fields if provided
            if (limitAmount !== undefined && limitAmount !== null && limitAmount <= 0) {
                return res.status(400).send('Limit amount must be greater than 0');
            }

            if (periodType && !['weekly', 'biweekly', 'monthly'].includes(periodType)) {
                return res.status(400).send('Invalid period type. Must be: weekly, biweekly, or monthly');
            }

            const result = await BudgetModel.updateBudget({
                budgetId,
                userId,
                limitAmount,
                periodType,
                startDate,
                endDate
            });

            if (!result.success) {
                return res.status(404).send(result.message);
            }

            res.json({
                success: true,
                message: result.message
            });
        } catch (err) {
            console.error('Error in updateBudget:', err);
            res.status(500).send('error: ' + err.message);
        }
    }

    /**
     * DELETE /budgets/:budgetId
     * Soft delete a budget
     */
    static async deleteBudget(req, res) {
        try {
            const { budgetId } = req.params;
            const email = req.body.email || req.query.email;

            if (!email) {
                return res.status(400).send('Email is required');
            }

            const userId = await UserModel.getUserIdByEmail({ email });

            if (!userId) {
                return res.status(404).send('User not found');
            }

            const result = await BudgetModel.softDeleteBudget({ budgetId, userId });

            if (!result.success) {
                return res.status(404).send(result.message);
            }

            res.json({
                success: true,
                message: result.message
            });
        } catch (err) {
            console.error('Error in deleteBudget:', err);
            res.status(500).send('error: ' + err.message);
        }
    }

    /**
     * GET /budgets/:email/summary
     * Get budget summary statistics for dashboard
     */
    static async getBudgetSummary(req, res) {
        try {
            const email = req.params.email;
            const userId = await UserModel.getUserIdByEmail({ email });

            if (!userId) {
                return res.status(404).send('User not found');
            }

            const budgets = await BudgetModel.getAllBudgetsWithSpending({ userId });
            const alerts = await BudgetModel.getBudgetAlerts({ userId });

            // Calculate summary statistics
            const summary = {
                totalBudgets: budgets.length,
                totalAlerts: alerts.totalAlerts,
                overBudgetCount: alerts.overBudget.length,
                nearLimitCount: alerts.nearLimit.length,
                totalBudgeted: budgets.reduce((sum, b) => sum + b.limitAmount, 0),
                totalSpent: budgets.reduce((sum, b) => sum + b.totalSpent, 0),
                totalRemaining: budgets.reduce((sum, b) => sum + b.remaining, 0)
            };

            res.json(summary);
        } catch (err) {
            console.error('Error in getBudgetSummary:', err);
            res.status(500).send('error: ' + err.message);
        }
    }
}
