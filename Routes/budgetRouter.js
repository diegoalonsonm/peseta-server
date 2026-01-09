import { Router } from "express";
import { BudgetController } from "../Controllers/budgetController.js";

const budgetRouter = Router();

// GET routes
budgetRouter.get('/:email', BudgetController.getAllBudgets);
budgetRouter.get('/:email/alerts', BudgetController.getBudgetAlerts);
budgetRouter.get('/:email/summary', BudgetController.getBudgetSummary);
budgetRouter.get('/:email/category/:categoryId', BudgetController.getBudgetByCategory);

// POST routes
budgetRouter.post('/', BudgetController.createBudget);

// PUT routes
budgetRouter.put('/:budgetId', BudgetController.updateBudget);

// DELETE routes
budgetRouter.delete('/:budgetId', BudgetController.deleteBudget);

export default budgetRouter;
