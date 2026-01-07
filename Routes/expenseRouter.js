import { Router } from "express";
import { ExpenseController } from "../Controllers/expenseController.js";

const expenseRouter = Router()

expenseRouter.get('/lastFive/:email', ExpenseController.getLastFiveFromUser)
expenseRouter.get('/totalAmount/:email', ExpenseController.getTotalAmountFromUser)
expenseRouter.get('/amountByCategory/:email', ExpenseController.getAmountByCategory)
expenseRouter.get('/top5Categories/:email', ExpenseController.getTop5Categories)
expenseRouter.get('/monthlyExpense/:email', ExpenseController.getMonthlyExpense)
expenseRouter.get('/:email', ExpenseController.getAllFromUser)

expenseRouter.post('/', ExpenseController.addExpense)
expenseRouter.delete('/:id', ExpenseController.deleteExpense)

export default expenseRouter