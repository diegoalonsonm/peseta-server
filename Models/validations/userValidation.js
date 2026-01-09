import z from 'zod';

const userValidation = z.object({
    name: z.string({ required_error: 'Name is required', invalid_type_error: 'Name must be a string' }),
    lastName: z.string({ required_error: 'Last name is required', invalid_type_error: 'Last name must be a string' }),
    email: z.string({ required_error: 'Email is required', invalid_type_error: 'Must be a valid email direction' }),
    password: z.string({ required_error: 'Password is required', invalid_type_error: 'Password must be a string' })
})

const recoveryValidation = z.object({
    email: z.string({ required_error: 'Email is required', invalid_type_error: 'Must be a valid email direction' }),
})

export function validateUser({object}) {
    return userValidation.safeParse(object)
}

export function validatePartialUser({object}) {
    return userValidation.partial().safeParse(object)
}

export function validateRecovery({object}) {
    return recoveryValidation.safeParse(object)
}