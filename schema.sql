-- Restaurant Inventory Schema 

CREATE DATABASE IF NOT EXISTS restaurant_inventory_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE restaurant_inventory_db;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `Order`;
DROP TABLE IF EXISTS Recipe;
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Staff;
DROP TABLE IF EXISTS Menu_Item;
DROP TABLE IF EXISTS Food_Batch;
DROP TABLE IF EXISTS Nutrition;
DROP TABLE IF EXISTS Food_Item;
DROP TABLE IF EXISTS Category;

SET FOREIGN_KEY_CHECKS = 1;

-- Category 
CREATE TABLE Category (
  category_id   INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL UNIQUE,
  description   VARCHAR(255)
) ENGINE=InnoDB;

-- Food_Item 
CREATE TABLE Food_Item (
  food_item_id    INT AUTO_INCREMENT PRIMARY KEY,
  category_id     INT NOT NULL,
  item_name       VARCHAR(150) NOT NULL,
  unit_of_measure VARCHAR(20) NOT NULL,
  is_perishable   TINYINT(1) NOT NULL DEFAULT 1,
  FOREIGN KEY (category_id) REFERENCES Category(category_id)
) ENGINE=InnoDB;

-- Nutrition (1:1) 
CREATE TABLE Nutrition (
  food_item_id INT PRIMARY KEY,
  calories_cal DECIMAL(8,2) NOT NULL DEFAULT 0,
  protein_g    DECIMAL(8,2) NOT NULL DEFAULT 0,
  carbs_g      DECIMAL(8,2) NOT NULL DEFAULT 0,
  fat_g        DECIMAL(8,2) NOT NULL DEFAULT 0,
  sodium_mg    DECIMAL(8,2) NOT NULL DEFAULT 0,
  FOREIGN KEY (food_item_id) REFERENCES Food_Item(food_item_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Food_Batch 
CREATE TABLE Food_Batch (
  batch_id           INT AUTO_INCREMENT PRIMARY KEY,
  food_item_id       INT NOT NULL,
  quantity_received  DECIMAL(10,2) NOT NULL,
  quantity_remaining DECIMAL(10,2) NOT NULL,
  expiration_date    DATE NOT NULL,
  received_date      DATE NOT NULL,
  FOREIGN KEY (food_item_id) REFERENCES Food_Item(food_item_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Menu_Item 
CREATE TABLE Menu_Item (
  menu_item_id  INT AUTO_INCREMENT PRIMARY KEY,
  item_name     VARCHAR(150) NOT NULL,
  selling_price DECIMAL(10,2) NOT NULL,
  is_available  TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

-- Recipe
CREATE TABLE Recipe (
  menu_item_id      INT NOT NULL,
  food_item_id      INT NOT NULL,
  quantity_required DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (menu_item_id, food_item_id),
  FOREIGN KEY (menu_item_id) REFERENCES Menu_Item(menu_item_id) ON DELETE CASCADE,
  FOREIGN KEY (food_item_id) REFERENCES Food_Item(food_item_id)
) ENGINE=InnoDB;

-- Staff 
CREATE TABLE Staff (
  staff_id   INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(60) NOT NULL,
  last_name  VARCHAR(60) NOT NULL,
  role       VARCHAR(30) NOT NULL
) ENGINE=InnoDB;

-- Users 
CREATE TABLE Users (
  user_id       INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  staff_id      INT NULL,
  FOREIGN KEY (staff_id) REFERENCES Staff(staff_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Order 
CREATE TABLE `Order` (
  order_id        INT AUTO_INCREMENT PRIMARY KEY,
  staff_id        INT NOT NULL,
  menu_item_id    INT NOT NULL,
  order_timestamp DATETIME NOT NULL,
  quantity        INT NOT NULL,
  total_price     DECIMAL(10,2) NOT NULL,
  order_status    VARCHAR(20) NOT NULL DEFAULT 'Pending',
  FOREIGN KEY (staff_id) REFERENCES Staff(staff_id),
  FOREIGN KEY (menu_item_id) REFERENCES Menu_Item(menu_item_id)
) ENGINE=InnoDB;