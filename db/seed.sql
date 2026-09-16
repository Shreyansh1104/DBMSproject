-- Restaurant Inventory Data Seeding

USE restaurant_inventory_db;

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE `Order`;
TRUNCATE TABLE Recipe;
TRUNCATE TABLE Users;
TRUNCATE TABLE Staff;
TRUNCATE TABLE Menu_Item;
TRUNCATE TABLE Food_Batch;
TRUNCATE TABLE Nutrition;
TRUNCATE TABLE Food_Item;
TRUNCATE TABLE Category;

SET FOREIGN_KEY_CHECKS = 1;

--  Category 
INSERT INTO Category (category_name, description) VALUES
('Vegetables', 'Fresh produce used across dishes'),
('Meat',       'Beef, chicken, pork and other meats'),
('Dairy',      'Milk, cheese, butter and dairy products'),
('Seafood',    'Fish and shellfish'),
('Grains',     'Rice, flour, pasta and bread bases'),
('Spices',     'Herbs, seasonings and spice blends'),
('Beverages',  'Soft drinks, juices, and mixers'),
('Sauces',     'Condiments and prepared sauces'),
('Bakery',     'Buns, doughs and baked goods'),
('Frozen',     'Frozen ready-to-use ingredients');

--  Food_Item 
INSERT INTO Food_Item (category_id, item_name, unit_of_measure, is_perishable) VALUES
(2,  'Chicken Breast',   'kg',     1),
(1,  'Lettuce',          'kg',     1),
(3,  'Cheddar Cheese',   'kg',     1),
(4,  'Salmon Fillet',    'kg',     1),
(5,  'Burger Bun',       'pieces', 1),
(6,  'Black Pepper',     'kg',     0),
(7,  'Cola Syrup',       'liters', 0),
(8,  'Ketchup',          'liters', 0),
(1,  'Tomato',           'kg',     1),
(2,  'Beef Patty',       'pieces', 1);

--  Nutrition 
INSERT INTO Nutrition (food_item_id, calories_cal, protein_g, carbs_g, fat_g, sodium_mg) VALUES
(1,  165, 31.0, 0.0,  3.6,  74),
(2,  15,  1.4,  2.9,  0.2,  28),
(3,  403, 25.0, 1.3,  33.0, 621),
(4,  208, 20.0, 0.0,  13.0, 59),
(5,  265, 9.0,  49.0, 3.5,  490),
(6,  251, 10.4, 63.9, 3.3,  20),
(7,  180, 0.0,  46.0, 0.0,  15),
(8,  112, 1.7,  25.8, 0.5,  907),
(9,  18,  0.9,  3.9,  0.2,  5),
(10, 250, 17.0, 0.0,  20.0, 75);

--  Food_Batch 
INSERT INTO Food_Batch (food_item_id, quantity_received, quantity_remaining, expiration_date, received_date) VALUES
(1,  20.0, 12.5, '2026-09-20', '2026-09-10'),
(2,  10.0, 4.0,  '2026-09-14', '2026-09-10'),
(3,  8.0,  5.5,  '2026-10-05', '2026-09-08'),
(4,  15.0, 6.0,  '2026-09-16', '2026-09-12'),
(5,  200,  120,  '2026-09-25', '2026-09-11'),
(6,  5.0,  4.2,  '2027-03-01', '2026-08-01'),
(7,  50.0, 30.0, '2027-01-01', '2026-08-15'),
(8,  25.0, 18.0, '2026-12-01', '2026-08-20'),
(9,  18.0, 9.0,  '2026-09-15', '2026-09-11'),
(10, 60,   40,   '2026-09-30', '2026-09-09');

--  Menu_Item 
INSERT INTO Menu_Item (item_name, selling_price, is_available) VALUES
('Classic Cheeseburger',  8.99,  1),
('Grilled Chicken Salad', 9.49,  1),
('Salmon Fillet Plate',   14.99, 1),
('Veggie Burger',         7.99,  1),
('Chicken Sandwich',      7.49,  1),
('Cola',                  2.49,  1),
('Cheese Fries',          4.99,  1),
('Caesar Salad',          6.99,  0),
('Beef Sliders (3pc)',    9.99,  1),
('Garlic Bread',          3.99,  1);

--  Recipe 
INSERT INTO Recipe (menu_item_id, food_item_id, quantity_required) VALUES
(1,  10, 0.15),
(1,  5,  1),
(2,  1,  0.12),
(2,  2,  0.08),
(3,  4,  0.20),
(4,  9,  0.10),
(5,  1,  0.10),
(6,  7,  0.25),
(7,  3,  0.05),
(9,  10, 0.30);

--  Staff 
INSERT INTO Staff (first_name, last_name, role) VALUES
('Aarav',  'Sharma', 'Chef'),
('Priya',  'Nair',   'Waiter'),
('Rohan',  'Verma',  'Cashier'),
('Sneha',  'Iyer',   'Waiter'),
('Karan',  'Mehta',  'Chef'),
('Anjali', 'Gupta',  'Manager'),
('Vikram', 'Rao',    'Waiter'),
('Neha',   'Kapoor', 'Cashier'),
('Aditya', 'Joshi',  'Chef'),
('Ishita', 'Singh',  'Waiter');

--  Users 
-- password_hash = Base64('resto:' + password)
INSERT INTO Users (name, email, password_hash, staff_id) VALUES
('System Admin', 'admin@gmail.com', 'cmVzdG86YWRtaW4xMjM=', NULL);

--  Order 
INSERT INTO `Order` (staff_id, menu_item_id, order_timestamp, quantity, total_price, order_status) VALUES
(2,  1,  '2026-09-15 12:30:00', 2, 17.98, 'Served'),
(4,  2,  '2026-09-15 12:45:00', 1, 9.49,  'Served'),
(7,  3,  '2026-09-15 13:00:00', 1, 14.99, 'Cooking'),
(2,  6,  '2026-09-15 13:05:00', 3, 7.47,  'Served'),
(10, 4,  '2026-09-15 13:10:00', 2, 15.98, 'Pending'),
(4,  9,  '2026-09-15 13:15:00', 1, 9.99,  'Cooking'),
(7,  7,  '2026-09-15 13:20:00', 2, 9.98,  'Served'),
(2,  5,  '2026-09-15 13:25:00', 1, 7.49,  'Pending'),
(10, 10, '2026-09-15 13:30:00', 2, 7.98,  'Served'),
(4,  8,  '2026-09-15 13:35:00', 1, 6.99,  'Cancelled');