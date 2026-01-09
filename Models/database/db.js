import { Sequelize } from "sequelize";
import { config } from "dotenv";
// Explicitly import mysql2 to ensure Vercel bundles it
import mysql2 from 'mysql2';

config()

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    dialectModule: mysql2,  // Explicitly provide mysql2 module to avoid dynamic loading
    operatorsAliases: false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
})

export const db = {}
db.sequelize = sequelize