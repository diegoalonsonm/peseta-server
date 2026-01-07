DROP DATABASE IF EXISTS cashController;
CREATE DATABASE cashController;
USE cashController;

CREATE TABLE category (
    id INT AUTO_INCREMENT PRIMARY KEY,
    description VARCHAR(50) NOT NULL
);

CREATE TABLE users (
    id CHAR(36) PRIMARY KEY, 
    name VARCHAR(50) NOT NULL,
    lastName VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    availableBudget DECIMAL(12, 2) DEFAULT 0.00,
    profilePic TEXT
);

CREATE TABLE expense (
    id CHAR(36) PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    categoryId INT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    date DATE NOT NULL,
    userId CHAR(36) NOT NULL, 
    active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (categoryId) REFERENCES category(id)
);

CREATE TABLE income (
    id CHAR(36) PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    categoryId INT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    date DATE NOT NULL,
    userId CHAR(36) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (categoryId) REFERENCES category(id)
);

insert into category (description) values ('Food');
insert into category (description) values ('Transport');
insert into category (description) values ('Health');
insert into category (description) values ('Education');
insert into category (description) values ('Entertainment');
insert into category (description) values ('Clothes');
insert into category (description) values ('Rent');
insert into category (description) values ('Services');
insert into category (description) values ('Salary');
insert into category (description) values ('Investment');
insert into category (description) values ('Gifts');
insert into category (description) values ('Savings');
insert into category (description) values ('Loans');
insert into category (description) values ('Insurance');
insert into category (description) values ('Others');