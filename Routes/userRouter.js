import { Router } from "express";
import { UserController } from "../Controllers/userController.js";

const userRouter = Router()

userRouter.get('/', UserController.getAll)
userRouter.get('/:email', UserController.getOne)
userRouter.post('/', UserController.newUser)
userRouter.put('/:email', UserController.updateUserInfo)

userRouter.post('/recovery', UserController.resetPassword)

userRouter.get('/balance/:email', UserController.getBalance)
userRouter.get('/balance/update/:email', UserController.updateBalance)

export default userRouter