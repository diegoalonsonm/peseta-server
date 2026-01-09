import { Router } from "express";
import { IncomeController } from "../Controllers/incomeController.js";

const incomeRouter = Router()

incomeRouter.get('/lastFive/:email', IncomeController.getLastFiveFromUser)
incomeRouter.get('/total/:email', IncomeController.getTotalAmountFromUser)
incomeRouter.get('/monthlyIncome/:email', IncomeController.getMonthlyIncome)
incomeRouter.get('/single/:id', IncomeController.getIncomeById)
incomeRouter.get('/:email', IncomeController.getAllFromUser)

incomeRouter.post('/', IncomeController.addIncome)
incomeRouter.put('/:id', IncomeController.updateIncome)
incomeRouter.delete('/:id', IncomeController.deleteIncome)

export default incomeRouter