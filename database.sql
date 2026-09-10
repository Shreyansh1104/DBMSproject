DROP DATABASE IF EXISTS food_expiry_nutrition_db;
CREATE DATABASE food_expiry_nutrition_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE food_expiry_nutrition_db;

CREATE TABLE User (
    user_id       INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    password      VARCHAR(255) NOT NULL,
    phone         VARCHAR(20),
    date_of_birth DATE,
    gender        ENUM('Male','Female','Other'),
    height        DECIMAL(5,2),
    weight        DECIMAL(5,2)
);

CREATE TABLE Category (
    category_id   INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description   TEXT,
    color         VARCHAR(20) DEFAULT '#8fa19f'
);

CREATE TABLE Food_Item (
    food_id       INT AUTO_INCREMENT PRIMARY KEY,
    food_name     VARCHAR(150) NOT NULL,
    category_id   INT,
    brand         VARCHAR(100),
    serving_size  DECIMAL(8,2),
    unit          VARCHAR(20),
    FOREIGN KEY (category_id) REFERENCES Category(category_id)
        ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE Food_Batch (
    batch_id           INT AUTO_INCREMENT PRIMARY KEY,
    food_id            INT NOT NULL,
    user_id            INT NOT NULL,
    purchase_date      DATE,
    quantity           DECIMAL(8,2) NOT NULL,
    unit               VARCHAR(20),
    manufacturing_date DATE,
    expiry_date        DATE NOT NULL,
    storage_location   VARCHAR(100),
    status             ENUM('Fresh','Near Expiry','Expired','Consumed') DEFAULT 'Fresh',
    FOREIGN KEY (food_id) REFERENCES Food_Item(food_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES User(user_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE Nutrition (
    nutrition_id  INT AUTO_INCREMENT PRIMARY KEY,
    food_id       INT NOT NULL,
    calories      DECIMAL(8,2),
    protein       DECIMAL(8,2),
    carbohydrates DECIMAL(8,2),
    fat           DECIMAL(8,2),
    fiber         DECIMAL(8,2),
    sugar         DECIMAL(8,2),
    sodium        DECIMAL(8,2),
    FOREIGN KEY (food_id) REFERENCES Food_Item(food_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE Consumption (
    consumption_id    INT AUTO_INCREMENT PRIMARY KEY,
    user_id           INT NOT NULL,
    batch_id          INT NOT NULL,
    quantity_consumed DECIMAL(8,2) NOT NULL,
    consumption_date  DATE NOT NULL,
    meal_type         ENUM('Breakfast','Lunch','Dinner','Snack'),
    FOREIGN KEY (user_id) REFERENCES User(user_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (batch_id) REFERENCES Food_Batch(batch_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE Reminder (
    reminder_id   INT AUTO_INCREMENT PRIMARY KEY,
    user_id       INT NOT NULL,
    batch_id      INT NOT NULL,
    reminder_date DATE NOT NULL,
    reminder_type ENUM('Expiry','Consumption') NOT NULL,
    status        ENUM('Pending','Sent','Dismissed') DEFAULT 'Pending',
    FOREIGN KEY (user_id) REFERENCES User(user_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (batch_id) REFERENCES Food_Batch(batch_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE Diet_Goal (
    goal_id      INT AUTO_INCREMENT PRIMARY KEY,
    user_id      INT NOT NULL,
    goal_type    VARCHAR(50) NOT NULL,
    target_value DECIMAL(8,2),
    unit         VARCHAR(20) DEFAULT 'kg',
    start_date   DATE,
    end_date     DATE,
    FOREIGN KEY (user_id) REFERENCES User(user_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE Nutrition_Goal (
    nutrition_goal_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id           INT NOT NULL,
    nutrient_name     VARCHAR(50) NOT NULL,
    daily_target      DECIMAL(8,2) NOT NULL,
    unit              VARCHAR(20),
    FOREIGN KEY (user_id) REFERENCES User(user_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX idx_batch_expiry          ON Food_Batch(expiry_date);
CREATE INDEX idx_batch_user            ON Food_Batch(user_id);
CREATE INDEX idx_consumption_user_date ON Consumption(user_id, consumption_date);
CREATE INDEX idx_reminder_user_date    ON Reminder(user_id, reminder_date);

INSERT INTO Category (category_name, description, color) VALUES
('Dairy',      'Milk, cheese, yogurt and other dairy products',  '#e8d9b5'),
('Fruits',     'Fresh and dried fruits',                          '#e2905a'),
('Vegetables', 'Fresh and frozen vegetables',                     '#7bab6e'),
('Grains',     'Rice, wheat, oats and other cereals',             '#c9a76b'),
('Meat',       'Chicken, mutton, beef and other meats',           '#c97b7b'),
('Seafood',    'Fish and other seafood',                          '#6fa8c9'),
('Beverages',  'Juices, soft drinks, and other drinks',           '#6fa8c9'),
('Snacks',     'Chips, biscuits, and packaged snacks',            '#d3c05a'),
('Bakery',     'Bread, cakes, and baked goods',                   '#d4a5c9'),
('Condiments', 'Sauces, spices, and seasonings',                  '#a389d4');

INSERT INTO User (name, email, password, phone, date_of_birth, gender, height, weight) VALUES
('Aarav Sharma', 'aarav.sharma@mail.com', 'hash1', '9876500001', '2002-03-14', 'Male',   175.0, 68.5),
('Priya Nair',   'priya.nair@mail.com',   'hash2', '9876500002', '2001-07-22', 'Female', 162.0, 55.0),
('Rohan Verma',  'rohan.verma@mail.com',  'hash3', '9876500003', '2003-01-09', 'Male',   180.0, 75.0),
('Sneha Iyer',   'sneha.iyer@mail.com',   'hash4', '9876500004', '2000-11-30', 'Female', 158.0, 52.0),
('Karan Mehta',  'karan.mehta@mail.com',  'hash5', '9876500005', '2002-05-18', 'Male',   170.0, 65.0),
('Anjali Gupta', 'anjali.gupta@mail.com', 'hash6', '9876500006', '2001-09-02', 'Female', 165.0, 58.0),
('Vikram Rao',   'vikram.rao@mail.com',   'hash7', '9876500007', '2003-12-25', 'Male',   178.0, 72.0),
('Neha Kapoor',  'neha.kapoor@mail.com',  'hash8', '9876500008', '2002-02-14', 'Female', 160.0, 54.0),
('Aditya Joshi', 'aditya.joshi@mail.com', 'hash9', '9876500009', '2000-06-08', 'Male',   172.0, 70.0),
('Ishita Singh', 'ishita.singh@mail.com', 'hash10','9876500010', '2001-04-19', 'Female', 163.0, 56.0);

INSERT INTO Food_Item (food_name, category_id, brand, serving_size, unit) VALUES
('Toned Milk',        1, 'Amul',        250, 'ml'),
('Banana',            2, 'Local Farm',  120, 'g'),
('Spinach',           3, 'Local Farm',  100, 'g'),
('Basmati Rice',      4, 'India Gate',  150, 'g'),
('Chicken Breast',    5, 'Licious',     100, 'g'),
('Rohu Fish',         6, 'FreshCatch',  150, 'g'),
('Orange Juice',      7, 'Real',        200, 'ml'),
('Potato Chips',      8, 'Lays',        30,  'g'),
('Whole Wheat Bread', 9, 'Britannia',   35,  'g'),
('Tomato Ketchup',   10, 'Kissan',      15,  'g');

INSERT INTO Nutrition (food_id, calories, protein, carbohydrates, fat, fiber, sugar, sodium) VALUES
(1,  120, 6.5, 9.5,  6.0, 0.0, 9.5,  105),
(2,  105, 1.3, 27.0, 0.4, 3.1, 14.0, 1),
(3,  23,  2.9, 3.6,  0.4, 2.2, 0.4,  79),
(4,  205, 4.3, 45.0, 0.4, 0.6, 0.1,  1),
(5,  165, 31.0,0.0,  3.6, 0.0, 0.0,  74),
(6,  97,  16.6,0.0,  3.0, 0.0, 0.0,  59),
(7,  112, 1.7, 25.8, 0.5, 0.5, 20.8, 9),
(8,  160, 2.0, 15.0, 10.0,1.0, 0.2,  170),
(9,  81,  4.0, 14.0, 1.0, 2.0, 1.5,  144),
(10, 15,  0.2, 4.0,  0.0, 0.0, 3.7,  160);

INSERT INTO Food_Batch (food_id, user_id, purchase_date, quantity, unit, manufacturing_date, expiry_date, storage_location, status) VALUES
(1, 1, CURDATE() - INTERVAL 9 DAY, 1000, 'ml', CURDATE() - INTERVAL 13 DAY, CURDATE() + INTERVAL 1 DAY,  'Fridge',  'Near Expiry'),
(2, 2, CURDATE() - INTERVAL 5 DAY, 6,    'pcs',CURDATE() - INTERVAL 7 DAY,  CURDATE() + INTERVAL 2 DAY,  'Counter', 'Fresh'),
(3, 3, CURDATE() - INTERVAL 4 DAY, 500,  'g',  CURDATE() - INTERVAL 5 DAY,  CURDATE() + INTERVAL 1 DAY,  'Fridge',  'Fresh'),
(4, 4, CURDATE() - INTERVAL 26 DAY,5,    'kg', CURDATE() - INTERVAL 40 DAY, CURDATE() + INTERVAL 325 DAY,'Pantry',  'Fresh'),
(5, 5, CURDATE() - INTERVAL 3 DAY, 1,    'kg', CURDATE() - INTERVAL 4 DAY,  CURDATE() + INTERVAL 1 DAY,  'Freezer', 'Near Expiry'),
(6, 6, CURDATE() - INTERVAL 3 DAY, 500,  'g',  CURDATE() - INTERVAL 4 DAY,  CURDATE() - INTERVAL 1 DAY,  'Freezer', 'Expired'),
(7, 7, CURDATE() - INTERVAL 8 DAY, 2,    'l',  CURDATE() - INTERVAL 21 DAY, CURDATE() + INTERVAL 71 DAY, 'Fridge',  'Fresh'),
(8, 8, CURDATE() - INTERVAL 2 DAY, 3,    'pcs',CURDATE() - INTERVAL 99 DAY, CURDATE() + INTERVAL 84 DAY, 'Pantry',  'Fresh'),
(9, 9, CURDATE() - INTERVAL 6 DAY, 1,    'pcs',CURDATE() - INTERVAL 7 DAY,  CURDATE() + INTERVAL 1 DAY,  'Counter', 'Fresh'),
(10,10,CURDATE() - INTERVAL 21 DAY,1,    'bottle',CURDATE()-INTERVAL 71 DAY,CURDATE()+INTERVAL 113 DAY, 'Pantry',  'Fresh');

INSERT INTO Diet_Goal (user_id, goal_type, target_value, unit, start_date, end_date) VALUES
(1,  'Weight Loss', 65.0, 'kg', CURDATE() - INTERVAL 40 DAY, CURDATE() + INTERVAL 82 DAY),
(2,  'Maintenance', 55.0, 'kg', CURDATE() - INTERVAL 40 DAY, CURDATE() + INTERVAL 82 DAY),
(3,  'Weight Gain', 80.0, 'kg', CURDATE() - INTERVAL 40 DAY, CURDATE() + INTERVAL 113 DAY),
(4,  'Weight Loss', 50.0, 'kg', CURDATE() - INTERVAL 26 DAY, CURDATE() + INTERVAL 66 DAY),
(5,  'Muscle Gain', 70.0, 'kg', CURDATE() - INTERVAL 40 DAY, CURDATE() + INTERVAL 145 DAY),
(6,  'Maintenance', 58.0, 'kg', CURDATE() - INTERVAL 9 DAY,  CURDATE() + INTERVAL 112 DAY),
(7,  'Weight Loss', 75.0, 'kg', CURDATE() - INTERVAL 40 DAY, CURDATE() + INTERVAL 82 DAY),
(8,  'Maintenance', 54.0, 'kg', CURDATE() - INTERVAL 40 DAY, CURDATE() + INTERVAL 52 DAY),
(9,  'Weight Gain', 75.0, 'kg', CURDATE() - INTERVAL 40 DAY, CURDATE() + INTERVAL 113 DAY),
(10, 'Weight Loss', 52.0, 'kg', CURDATE() - INTERVAL 40 DAY, CURDATE() + INTERVAL 82 DAY);

INSERT INTO Nutrition_Goal (user_id, nutrient_name, daily_target, unit) VALUES
(1,'Calories',2200,'kcal'),(1,'Protein',60,'g'),(1,'Fiber',25,'g'),(1,'Sodium',2300,'mg'),(1,'Sugar',30,'g'),
(2,'Calories',2000,'kcal'),(2,'Protein',60,'g'),(2,'Fiber',25,'g'),(2,'Sodium',2000,'mg'),(2,'Sugar',40,'g'),
(3,'Calories',2800,'kcal'),(3,'Protein',90,'g'),(3,'Fiber',30,'g'),(3,'Sodium',2500,'mg'),(3,'Sugar',50,'g'),
(4,'Calories',1900,'kcal'),(4,'Protein',110,'g'),(4,'Fiber',30,'g'),(4,'Sodium',1800,'mg'),(4,'Sugar',35,'g'),
(5,'Calories',2100,'kcal'),(5,'Protein',95,'g'),(5,'Fiber',26,'g'),(5,'Sodium',2100,'mg'),(5,'Sugar',38,'g'),
(6,'Calories',2000,'kcal'),(6,'Protein',75,'g'),(6,'Fiber',25,'g'),(6,'Sodium',2000,'mg'),(6,'Sugar',45,'g'),
(7,'Calories',2400,'kcal'),(7,'Protein',85,'g'),(7,'Fiber',28,'g'),(7,'Sodium',2300,'mg'),(7,'Sugar',40,'g'),
(8,'Calories',1900,'kcal'),(8,'Protein',70,'g'),(8,'Fiber',25,'g'),(8,'Sodium',2000,'mg'),(8,'Sugar',30,'g'),
(9,'Calories',2600,'kcal'),(9,'Protein',85,'g'),(9,'Fiber',30,'g'),(9,'Sodium',2300,'mg'),(9,'Sugar',45,'g'),
(10,'Calories',1900,'kcal'),(10,'Protein',65,'g'),(10,'Fiber',25,'g'),(10,'Sodium',1800,'mg'),(10,'Sugar',30,'g');

INSERT INTO Consumption (user_id, batch_id, quantity_consumed, consumption_date, meal_type) VALUES
(1, 1, 250, CURDATE(), 'Breakfast'),
(2, 2, 1,   CURDATE(), 'Snack'),
(3, 3, 100, CURDATE(), 'Lunch'),
(4, 4, 150, CURDATE(), 'Dinner'),
(5, 5, 100, CURDATE(), 'Lunch'),
(7, 7, 200, CURDATE(), 'Breakfast'),
(8, 8, 30,  CURDATE(), 'Snack'),
(9, 9, 35,  CURDATE(), 'Breakfast'),
(10,10, 15, CURDATE(), 'Lunch');