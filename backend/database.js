import mysql from 'mysql2/promise'; // Import the promise-based version
import bcrypt from 'bcrypt'; // Import bcrypt
import dotenv from 'dotenv';
dotenv.config();


// Create a connection pool
const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
});

// Create a new user (for registration)
export async function createUser(firstname, lastname, email, password) {
  // Check if the email already exists
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw new Error('Email already exists');
  }

  // Hash password before storing
  // const hashedPassword = await bcrypt.hash(password, 10);
  const [result] = await pool.query(`
    INSERT INTO users (firstname, lastname, email, password)
    VALUES (?, ?, ?, ?)
  `, [firstname, lastname, email, password]);
  
  return result.insertId; // Return the new user's ID
}

// Check if user exists by email
export async function getUserByEmail(email) {
  const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
  return rows[0]; // Returns the user details if found, otherwise undefined
}

// Function to authenticate user (check password)
// export async function authenticateUser(email, password) {
//   const user = await getUserByEmail(email);
//   if (!user) {
//     throw new Error('User not found');
//   }

//   // Compare the provided password with the stored hashed password
//   const isMatch = await bcrypt.compare(password, user.password);
//   if (!isMatch) {
//     throw new Error('Invalid password');
//   }

//   return user; // Return the authenticated user
// }



// Add function to fetch the card counts
export async function getCardCounts() {
  // Total number of cards
  const [totalRows] = await pool.query("SELECT COUNT(*) AS total FROM cards")
  const total = totalRows[0].total

  // Pending cards
  const [pendingRows] = await pool.query("SELECT COUNT(*) AS pending FROM cards WHERE status = 'Pending'")
  const pending = pendingRows[0].pending

  // Collected cards
  const [collectedRows] = await pool.query("SELECT COUNT(*) AS collected FROM cards WHERE status = 'Collected'")
  const collected = collectedRows[0].collected
  return { total, pending, collected }
}
// Infomatics code for last 7 days
export const getLast7DaysData = async () => {
  const query = `
    SELECT 
      DATE(created) AS day, 
      COUNT(*) AS records 
    FROM cards 
    WHERE created >= DATE(NOW() - INTERVAL 7 DAY) 
    GROUP BY day 
    ORDER BY day ASC;
  `;
  const [rows] = await pool.query(query);
  return rows;
};

//Pending over time infomatics code
export const getPendingOverTimeData = async () => {
  const query = `
    SELECT 
      DATE(created) AS day, 
      COUNT(*) AS pending 
    FROM cards 
    WHERE status = 'Pending' AND created >= DATE(NOW() - INTERVAL 7 DAY) 
    GROUP BY day 
    ORDER BY day ASC;
  `;
  const [rows] = await pool.query(query);
    // Log the fetched data

  return rows;
};

//Pending by field infomatics code
export const getPendingByFieldData = async () => {
  const query = `
    SELECT 
      field_of_study, 
      COUNT(*) AS count 
    FROM cards 
    WHERE status = 'Pending' 
    GROUP BY field_of_study;
  `;
  const [rows] = await pool.query(query);
  return rows;
};
//Infomatics code colleted by month
export const getCollectedByMonthData = async () => {
  const query = `
    SELECT 
      DATE_FORMAT(created, '%b') AS month, 
      SUM(CASE WHEN status = 'Collected' THEN 1 ELSE 0 END) AS collected,
      SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending
    FROM cards 
    WHERE created >= DATE(NOW() - INTERVAL 6 MONTH) 
    GROUP BY month 
    ORDER BY MIN(created) ASC;  -- Use MIN(created) to order by the earliest date in each month
  `;
  const [rows] = await pool.query(query);
  return rows;
};

//Infomatics code collected by day
export const getCollectedByDayData = async () => {
  const query = `
      SELECT 
    DATE(created) AS date,
    DAYNAME(created) AS day, 
    COUNT(*) AS collected 
  FROM cards 
  WHERE status = 'Collected' 
  GROUP BY date, day 
  ORDER BY FIELD(day, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday');

  `;
  const [rows] = await pool.query(query);
  console.log("Show", rows);
  return rows;
};

//get all cards
export async function getCards(status) {
  let query = "SELECT * FROM cards";
  const params = [];

  if (status) {
    query += " WHERE LOWER(status) = ?";
    params.push(status.toLowerCase());
  }

  const [rows] = await pool.query(query, params);
  return rows;
}
//............................................................................stock transactions
// Get all stock transactions with optional filtering by transaction type// Update getStockTransactions, for inboun, outbound and adjustments
export async function getStockTransactions(filters) {
  console.log("📦 getStockTransactions called with filters:", filters);

  let query = `
    SELECT 
      st.*, 
      p.name AS product_name,
      p.unit_price,
      p.current_quantity AS product_stock,
      s.name AS supplier_name,
      d.name AS department_name
    FROM stock_transactions st
    LEFT JOIN products p ON st.product_id = p.id
    LEFT JOIN suppliers s ON st.supplier_id = s.id
    LEFT JOIN departments d ON st.department_id = d.id
  `;
  
  const params = [];
  const whereClauses = [];

  if (filters.transaction_type) {
    whereClauses.push("st.transaction_type = ?");
    params.push(filters.transaction_type);
  }

  if (filters.product_id) {
    whereClauses.push("st.product_id = ?");
    params.push(filters.product_id);
  }

  if (whereClauses.length > 0) {
    query += " WHERE " + whereClauses.join(" AND ");
  }

  query += " ORDER BY st.date DESC";

  const [rows] = await pool.query(query, params);
  return rows;
}

//verify till this line

// get recent transaction
export async function getRecentStockTransactions(limit = 5) {
  const [rows] = await pool.query(
    "SELECT * FROM stock_transactions ORDER BY transaction_date DESC LIMIT ?",
    [limit]
  );
  return rows;
}

export async function getInboundStockTransactions() {
  const [rows] = await pool.query(
    "SELECT * FROM stock_transactions WHERE LOWER(transaction_type) = 'inbound' ORDER BY transaction_date DESC"
  );
  return rows;
}

export async function getOutboundStockTransactions() {
  const [rows] = await pool.query(
    "SELECT * FROM stock_transactions WHERE LOWER(transaction_type) = 'outbound' ORDER BY transaction_date DESC"
  );
  return rows;
}

export async function getStockTransactionCounts() {
  const [results] = await pool.query(
    `SELECT 
      COUNT(*) AS total,
      SUM(transaction_type = 'inbound') AS inbound,
      SUM(transaction_type = 'outbound') AS outbound,
      SUM(transaction_type = 'adjustment') AS adjustments,
      ROUND(SUM(CASE WHEN transaction_type = 'inbound' THEN st.quantity * p.unit_price ELSE 0 END), 2) AS inbound_value,
      ROUND(SUM(CASE WHEN transaction_type = 'outbound' THEN st.quantity * p.unit_price ELSE 0 END), 2) AS outbound_value,
      ROUND(SUM(CASE WHEN transaction_type = 'adjustment' THEN st.quantity * p.unit_price ELSE 0 END), 2) AS adjustment_value
    FROM stock_transactions st
    JOIN products p ON st.product_id = p.id`
  );
  // Run separate query to get actual total stock value
  const [stockValue] = await pool.query(
    `SELECT ROUND(SUM(current_quantity * unit_price), 2) AS total_value FROM products`
  );

  // Merge both results
  const combined = { ...results[0], total_value: stockValue[0].total_value };

  // console.log("Correct Total Inventory Value:", combined.total_value);
  return combined;
}
// Get stock transaction stats for trends
export async function getStockTransactionStats() {
  // Get basic counts
  const [counts] = await pool.query(`
    SELECT 
      COUNT(*) AS totalTransactions,
      SUM(transaction_type = 'inbound') AS totalInbound,
      SUM(transaction_type = 'outbound') AS totalOutbound,
      SUM(transaction_type = 'adjustment') AS totalAdjustments
    FROM stock_transactions
  `);

  // Get inventory value
  const [inventoryValue] = await pool.query(`
    SELECT SUM(current_quantity * unit_price) AS inventoryValue 
    FROM products
  `);

  // Get trending products (most transacted products in last 7 days)
  const [trendingProducts] = await pool.query(`
SELECT 
  p.name,
  COUNT(st.id) AS transactionCount,
  SUM(CASE WHEN st.transaction_type = 'inbound' THEN st.quantity ELSE 0 END) AS inboundQty,
  SUM(CASE WHEN st.transaction_type = 'outbound' THEN st.quantity ELSE 0 END) AS outboundQty,
  ROUND(
    (SUM(CASE WHEN st.transaction_type = 'inbound' THEN st.quantity ELSE 0 END) - 
     SUM(CASE WHEN st.transaction_type = 'outbound' THEN st.quantity ELSE 0 END)) / 
    NULLIF(SUM(CASE WHEN st.transaction_type = 'inbound' THEN st.quantity ELSE 0 END), 0) * 100, 
  2) AS changePercentage
FROM (
  SELECT * 
  FROM stock_transactions 
  ORDER BY date DESC 
  LIMIT 7
) AS st
JOIN products p ON st.product_id = p.id
GROUP BY p.name
ORDER BY transactionCount DESC
LIMIT 5;

  `);

  return {
    totalTransactions: counts[0].totalTransactions || 0,
    totalInbound: counts[0].totalInbound || 0,
    totalOutbound: counts[0].totalOutbound || 0,
    inventoryValue: inventoryValue[0].inventoryValue || 0,
    trendingProducts: trendingProducts.map(p => ({
      name: p.name,
      transactionCount: p.transactionCount,
      changePercentage: p.changePercentage || 0
    }))
  };
}

// Get single stock transaction by ID
export async function getStockTransaction(id) {
  const [rows] = await pool.query(`
    SELECT 
      st.*, 
      p.name as product_name,
      p.unit_price,
      p.current_quantity as current_stock,
      s.name as supplier_name,
      d.name as department_name,
      CONCAT (u.firstname,' ', u.lastname ) as performed_by_name
    FROM stock_transactions st
    LEFT JOIN products p ON st.product_id = p.id
    LEFT JOIN users u ON st.performed_by = u.id
    LEFT JOIN suppliers s ON st.supplier_id = s.id
    LEFT JOIN departments d ON st.department_id = d.id
    WHERE st.id = ?
  `, [id]);
  return rows[0];
}

// Delete a stock transaction
export async function deleteStockTransaction(id) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    // 1. Get transaction details first
    const [transaction] = await connection.query(
      'SELECT * FROM stock_transactions WHERE id = ?', 
      [id]
    );
    
    if (!transaction[0]) {
      throw new Error('Transaction not found');
    }
    
    // 2. Reverse the stock impact
    if (transaction[0].transaction_type === 'inbound') {
      await connection.query(`
        UPDATE products 
        SET current_quantity = current_quantity - ? 
        WHERE id = ?
      `, [transaction[0].quantity, transaction[0].product_id]);
    } else if (transaction[0].transaction_type === 'outbound') {
      await connection.query(`
        UPDATE products 
        SET current_quantity = current_quantity + ? 
        WHERE id = ?
      `, [transaction[0].quantity, transaction[0].product_id]);
    }
    
    // 3. Delete the transaction
    await connection.query('DELETE FROM stock_transactions WHERE id = ?', [id]);
    
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Get document by ID
export async function getDocumentById(id) {
  const [rows] = await pool.query('SELECT * FROM documents WHERE id = ?', [id]);
  return rows[0];
}

// Get last 7 days of transactions
export async function getLast7DaysStockData() {
  const [rows] = await pool.query(`
    SELECT 
      DATE(date) AS day,
      SUM(CASE WHEN transaction_type = 'inbound' THEN 1 ELSE 0 END) AS inbound,
      SUM(CASE WHEN transaction_type = 'outbound' THEN 1 ELSE 0 END) AS outbound
    FROM stock_transactions
    WHERE date >= DATE(NOW() - INTERVAL 7 DAY)
    GROUP BY day
    ORDER BY day ASC
  `);
  console.log("Last 7 days stock data:", rows);
  return rows;
}

// Get all stock transactions with product info
// export async function getStockTransactions(transaction_type) {
//   let query = `
//     SELECT 
//       st.*,
//       p.name as product_name,
//       p.unit_price
//     FROM stock_transactions st
//     LEFT JOIN products p ON st.product_id = p.id
//   `;
//   const params = [];

//   if (transaction_type) {
//     query += " WHERE st.transaction_type = ?";
//     params.push(transaction_type);
//   }

//   query += " ORDER BY st.date DESC";

//   const [rows] = await pool.query(query, params);
//   return rows;
// }

// Delete a stock transaction (with stock adjustment)
// export async function deleteStockTransaction(id) {
//   const connection = await pool.getConnection();
//   try {
//     await connection.beginTransaction();

//     // 1. Get the transaction first
//     const [transaction] = await connection.query(
//       'SELECT * FROM stock_transactions WHERE id = ?', 
//       [id]
//     );

//     if (!transaction[0]) {
//       throw new Error('Transaction not found');
//     }

//     const { product_id, quantity, transaction_type } = transaction[0];

//     // 2. Reverse the stock impact
//     if (transaction_type === 'inbound') {
//       await connection.query(`
//         UPDATE products 
//         SET current_quantity = current_quantity - ? 
//         WHERE id = ?
//       `, [quantity, product_id]);
//     } else if (transaction_type === 'outbound') {
//       await connection.query(`
//         UPDATE products 
//         SET current_quantity = current_quantity + ? 
//         WHERE id = ?
//       `, [quantity, product_id]);
//     }

//     // 3. Delete the transaction
//     await connection.query('DELETE FROM stock_transactions WHERE id = ?', [id]);

//     await connection.commit();
//     return true;
//   } catch (error) {
//     await connection.rollback();
//     throw error;
//   } finally {
//     connection.release();
//   }
// }
//............................inbound stock
// Add these functions to your database.js

// Get inbound stock over time
export async function getInboundOverTime() {
  const [rows] = await pool.query(`
    SELECT 
      DATE(date) AS day,
      SUM(quantity) AS quantity,
      SUM(quantity * COALESCE(unit_price, 0)) AS value
    FROM stock_transactions
    WHERE transaction_type = 'inbound'
    AND date >= DATE(NOW() - INTERVAL 30 DAY)
    GROUP BY day
    ORDER BY day ASC
  `);
  return rows;
}

// Get inbound stock by product
export async function getInboundByProduct() {
  const [rows] = await pool.query(`
    SELECT 
      p.name AS product_name,
      SUM(st.quantity) AS total_quantity
    FROM stock_transactions st
    JOIN products p ON st.product_id = p.id
    WHERE st.transaction_type = 'inbound'
    GROUP BY p.name
    ORDER BY total_quantity DESC
    LIMIT 10
  `);
  return rows;
}

// Get inbound statistics
export async function getInboundStats() {
  // console.log("📌 getInboundStats() was called");

  // First query: Basic stats
  const [statsResults] = await pool.query(`
    SELECT 
      COUNT(st.id) AS total,
      SUM(st.quantity) AS totalQuantity,
      SUM(st.quantity * COALESCE(p.unit_price, 0)) AS totalValue,
      AVG(st.quantity * COALESCE(p.unit_price, 0)) AS avgValue
    FROM stock_transactions st
    LEFT JOIN products p ON st.product_id = p.id
    WHERE st.transaction_type = 'inbound'
  `);

  const stats = statsResults[0];

  // Second query: Top suppliers by transaction value
  const [topSuppliers] = await pool.query(`
    SELECT 
      s.name,
      COUNT(st.id) AS transactionCount,
      SUM(st.quantity * COALESCE(p.unit_price, 0)) AS totalValue
    FROM stock_transactions st
    JOIN suppliers s ON st.supplier_id = s.id
    JOIN products p ON st.product_id = p.id
    WHERE st.transaction_type = 'inbound'
    GROUP BY s.name
    ORDER BY totalValue DESC
    LIMIT 5
  `);

  // console.log("Inbound stats:", stats);
  // console.log("Top suppliers:", topSuppliers);

  return {
    ...stats,
    topSuppliers
  };
}



// Get all inbound transactions
export async function getInboundTransactions() {
  const [rows] = await pool.query(`
    SELECT 
      st.*,
      p.name AS product_name,
      p.unit_price
    FROM stock_transactions st
    LEFT JOIN products p ON st.product_id = p.id
    WHERE st.transaction_type = 'inbound'
    ORDER BY st.date DESC
  `);
  return rows;
}
//............................inbound stock
//............................outbound stock

// Get outbound stock over time
export async function getOutboundOverTime() {
  const [rows] = await pool.query(`
    SELECT 
      DATE(date) AS day,
      SUM(st.quantity) AS quantity,
      SUM(st.quantity * COALESCE(p.unit_price, 0)) AS value
    FROM stock_transactions st
    LEFT JOIN products p ON st.product_id = p.id
    WHERE transaction_type = 'outbound'
    AND date >= DATE(NOW() - INTERVAL 30 DAY)
    GROUP BY day
    ORDER BY day ASC
  `);
  return rows;
}

// Get outbound stock by product
export async function getOutboundByProduct() {
  const [rows] = await pool.query(`
    SELECT 
      p.name AS product_name,
      SUM(st.quantity) AS total_quantity
    FROM stock_transactions st
    JOIN products p ON st.product_id = p.id
    WHERE st.transaction_type = 'outbound'
    GROUP BY p.name
    ORDER BY total_quantity DESC
    LIMIT 10
  `);
  return rows;
}

// Get outbound statistics
export async function getOutboundStats() {
  // First: Overall stats
  const [results] = await pool.query(`
    SELECT 
      COUNT(*) AS total,
      SUM(quantity) AS totalQuantity,
      SUM(quantity * COALESCE(p.unit_price, 0)) AS totalValue,
      AVG(quantity * COALESCE(p.unit_price, 0)) AS avgValue
    FROM stock_transactions st
    LEFT JOIN products p ON st.product_id = p.id
    WHERE transaction_type = 'outbound'
  `);

  // Second: Top departments by total outbound value
  const [topDepartments] = await pool.query(`
    SELECT 
      d.name AS name,
      COUNT(*) AS transactionCount,
      SUM(st.quantity * COALESCE(p.unit_price, 0)) AS totalValue
    FROM stock_transactions st
    LEFT JOIN departments d ON st.department_id = d.id
    LEFT JOIN products p ON st.product_id = p.id
    WHERE st.transaction_type = 'outbound'
    GROUP BY st.department_id
    ORDER BY totalValue DESC
    LIMIT 5
  `);

  return {
    ...results[0],
    topDepartments
  };
}

// Get all outbound transactions
export async function getOutboundTransactions() {
  const [rows] = await pool.query(`
    SELECT 
      st.*,
      p.name AS product_name,
      p.unit_price
    FROM stock_transactions st
    LEFT JOIN products p ON st.product_id = p.id
    WHERE st.transaction_type = 'outbound'
    ORDER BY st.date DESC
  `);
  return rows;
}
//............................outbound stock
//............................products
// Add these functions to your database.js

// Get all products with categories
export async function getProducts() {
  // First get categories
  const [categoryRows] = await pool.query("SELECT id, name FROM categories");
  const categories = {};
  categoryRows.forEach(cat => {
    categories[cat.id] = cat.name;
  });

  // Then get products
  const [productRows] = await pool.query(`
    SELECT * FROM products ORDER BY name
  `);
// console.log("Products fetched:", productRows);
// console.log("Categories fetched:", categories);
  return {
    products: productRows,
    categories
  };
}

// Delete a product
export async function deleteProduct(id) {
  const [result] = await pool.query("DELETE FROM products WHERE id = ?", [id]);
  return result.affectedRows > 0;
}

// Get single product by ID
export async function getProductById(id) {
  const [rows] = await pool.query(`
    SELECT p.*, c.name as category_name 
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ?
  `, [id]);
  return rows[0];
}

// Update a product
export async function updateProduct(id, updates) {
  const fields = [];
  const values = [];

  if (updates.name) {
    fields.push("name = ?");
    values.push(updates.name);
  }
  if (updates.category_id) {
    fields.push("category_id = ?");
    values.push(updates.category_id);
  }
  if (updates.unit_price) {
    fields.push("unit_price = ?");
    values.push(updates.unit_price);
  }
  if (updates.current_quantity) {
    fields.push("current_quantity = ?");
    values.push(updates.current_quantity);
  }

  if (fields.length === 0) {
    throw new Error("No valid fields to update");
  }

  values.push(id);
  await pool.query(`UPDATE products SET ${fields.join(", ")} WHERE id = ?`, values);
  return getProductById(id);
}
//..................add product

export async function createProduct(name, category_id, unit_price, added_by) {
  const [result] = await pool.query(`
    INSERT INTO products 
    (name, category_id, unit_price, initial_quantity, current_quantity, added_by)
    VALUES (?, ?, ?, 0, 0, ?)
  `, [name, category_id, unit_price, added_by]);
  
  return result.insertId;
}

// Add this function to get categories
export async function getCategories() {
  const [rows] = await pool.query('SELECT * FROM categories ORDER BY name');
  return rows;
}
//..................add product
//............................products
//............................add inbound stock transaction
// Add these functions to your database.js

// Create a new inbound stock transaction
export async function createInboundTransaction(transactionData) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    // 1. Create the transaction record
    const [result] = await connection.query(`
      INSERT INTO stock_transactions 
      (product_id, transaction_type, quantity, remarks, supplier_id, performed_by, date)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `, [
      transactionData.product_id,
      transactionData.transaction_type,
      transactionData.quantity,
      transactionData.remarks,
      transactionData.supplier_id,
      transactionData.performed_by
    ]);
    
    // 2. Update the product's current quantity
    await connection.query(`
      UPDATE products 
      SET current_quantity = current_quantity + ? 
      WHERE id = ?
    `, [transactionData.quantity, transactionData.product_id]);
    
    await connection.commit();
    return result.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Get all products for dropdown
export async function getProductsForDropdown() {
  const [rows] = await pool.query(`
    SELECT id, name, current_quantity 
    FROM products 
    ORDER BY name
  `);
  // console.log("these are the products:", rows)
  return rows;
}

// Get all suppliers for dropdown
export async function getSuppliersForDropdown() {
  const [rows] = await pool.query(`
    SELECT id, name, contact_person 
    FROM suppliers 
    ORDER BY name
  `);
  return rows;
}

// Add a new supplier
export async function addSupplier(supplierData) {
  const [result] = await pool.query(`
    INSERT INTO suppliers 
    (name, contact_person, phone, email)
    VALUES (?, ?, ?, ?)
  `, [
    supplierData.name,
    supplierData.contact_person,
    supplierData.phone,
    supplierData.email
  ]);
  return { id: result.insertId, ...supplierData };
}
//............................add inbound stock transaction
// both inbound and outbound transaction logic here
export async function createStockTransaction(transactionData) {
  const { product_id, transaction_type, quantity, remarks, performed_by, supplier_id, collected_by, department_id } = transactionData;
  
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    // 1. Create the transaction record
    const [result] = await connection.query(`
      INSERT INTO stock_transactions 
      (product_id, transaction_type, quantity, remarks, performed_by, supplier_id, collected_by, department_id, date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      product_id,
      transaction_type,
      quantity,
      remarks,
      performed_by,
      supplier_id,
      collected_by,
      department_id
    ]);
    
    // 2. Update product stock based on transaction type
    if (transaction_type === 'inbound') {
      await connection.query(`
        UPDATE products 
        SET current_quantity = current_quantity + ? 
        WHERE id = ?
      `, [quantity, product_id]);
    } else if (transaction_type === 'outbound') {
      await connection.query(`
        UPDATE products 
        SET current_quantity = current_quantity - ? 
        WHERE id = ?
      `, [quantity, product_id]);
    }
    else if (transaction_type === 'adjustment') {
      // First check if adjustment would make quantity negative
      const [rows] = await connection.query(
        'SELECT current_quantity FROM products WHERE id = ?',
        [product_id]
      );
      
      const currentQty = rows[0].current_quantity;
      if (currentQty + quantity < 0) {
        throw new Error('Stock cannot be negative');
      }
    
      // Then perform the update with proper numeric operation
      await connection.query(`
        UPDATE products 
        SET current_quantity = current_quantity + ? 
        WHERE id = ?
      `, [quantity, product_id]);
    }
    await connection.commit();
    return result.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
//..............................add outbound stock transactions
// Add this function to get departments
export async function getDepartments() {
  const [rows] = await pool.query('SELECT * FROM departments ORDER BY name');
  return rows;
}
//...............................add outbound stock transactions
//.................................................................................stock transactions
  
//   get single id
export async function getCard(id) {
  const [rows] = await pool.query(`
    SELECT cards.*, receipts.filename, receipts.filepath
    FROM cards
    LEFT JOIN receipts ON cards.receipt_id = receipts.id
    WHERE cards.id = ?
  `, [id]);
  console.log("Card fetched:", rows[0]);
  return rows[0];
}
  //...........................................................receipt
  // Insert a new receipt into the database
export async function insertReceipt(filename, filepath, uploadedBy) {
  const [result] = await pool.query(
    `INSERT INTO receipts (filename, filepath, uploaded_by) VALUES (?, ?, ?)`, //fix this id
    [filename, filepath, uploadedBy]
  );
  return result.insertId; // Return the ID of the inserted receipt
}

// Fetch a receipt by ID
export async function getReceiptById(id) {
  const [rows] = await pool.query('SELECT * FROM receipts WHERE id = ?', [id]);
  return rows[0]; // Return the first row (receipt) or undefined if not found
}
// Fetch recent receipts (with optional search)
export async function getRecentReceipts(search) {
  let query = 'SELECT * FROM receipts ORDER BY uploaded_at DESC LIMIT 50';
  let params = [];
  if (search) {
    query = 'SELECT * FROM receipts WHERE filename LIKE ? ORDER BY uploaded_at DESC LIMIT 50';
    params = [`%${search}%`];
  }
  const [rows] = await pool.query(query, params);
  return rows;
}

  //...........................................................receipt
//   const card = await getCard(1)
//   console.log(card)
// Check if an email already exists in the database//

// export async function checkEmailExists(email) {
//   const [rows] = await pool.query("SELECT COUNT(*) AS count FROM cards WHERE email = ?", [email]);
//   return rows[0].count > 0; // Returns true if email exists, false otherwise
// }

// Check if an NRC already exists in the database
export async function checkNrcExists(nrc) {
  const [rows] = await pool.query("SELECT COUNT(*) AS count FROM cards WHERE nrc = ?", [nrc]);
  return rows[0].count > 0; // Returns true if NRC exists, false otherwise
}

// create new id
export async function createCard(firstname, lastname, nrc, type, field_of_study, userId, receipt_id) { //start here tomorrow, receipt_id is not getting passed apparently. it need to be here before this statement even happens
  const [result] = await pool.query(`
    INSERT INTO cards (firstname, lastname, nrc, type, field_of_study, receipt_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [firstname, lastname, nrc, type, field_of_study, receipt_id]);

  const id = result.insertId;

  // Insert a notification
  const message = `New record added: ${firstname} ${lastname}`;
  await pool.query(`
    INSERT INTO notifications (message, user_id, is_read, created_at)
    VALUES (?, ?, ?, NOW())
  `, [message, userId, 0]);

  return getCard(id);
}
export async function getNotifications(userId) {
  const [rows] = await pool.query(`
    SELECT * FROM notifications 
    ORDER BY created_at DESC
  `, [userId]);
  // console.log(rows);
  return rows;
}

// Mark a notification as read
export async function markNotificationAsRead(notificationId) {
  await pool.query(`
    UPDATE notifications 
    SET is_read = 1 
    WHERE id = ?
  `, [notificationId]);
}
//....................................................................................................
// Update a card (PUT - replaces all fields)
export async function updateCard(id, firstname, lastname, status, /*email,*/ nrc, type, field_of_study) {
  await pool.query(//replaced email with field_of_study in sql statement
      "UPDATE cards SET firstname = ?, lastname = ?, status = ?, nrc = ?, type = ?, field_of_study ? WHERE id = ?",
      [firstname, lastname, status, /*email,*/ nrc, type, field_of_study, id]
  );
  return getCard(id); // Return the updated card
}
export async function patchStockTransaction(id, updates) {
  // 1. Fetch existing transaction
  const [existingRows] = await pool.query(
    "SELECT * FROM stock_transactions WHERE id = ?",
    [id]
  );
  if (existingRows.length === 0) {
    throw new Error("Transaction not found");
  }
  const existing = existingRows[0];

  // 2. Validate updates
  const fields = [];
  const values = [];
  
  // Build update fields
  if (updates.product_id) {
    fields.push("product_id = ?");
    values.push(updates.product_id);
  }
  if (updates.transaction_type) {
    fields.push("transaction_type = ?");
    values.push(updates.transaction_type);
  }
  if (updates.quantity !== undefined) {
    fields.push("quantity = ?");
    values.push(updates.quantity);
  }
  if (updates.date) {
    fields.push("date = ?");
    values.push(updates.date);
  }
  if (updates.remarks) {
    fields.push("remarks = ?");
    values.push(updates.remarks);
  }
  if (updates.supplier_id !== undefined) {
    fields.push("supplier_id = ?");
    values.push(updates.supplier_id);
  }
  if (updates.collected_by !== undefined) {
    fields.push("collected_by = ?");
    values.push(updates.collected_by);
  }
  if (updates.department_id !== undefined) {
    fields.push("department_id = ?");
    values.push(updates.department_id);
  }
  if (updates.performed_by) {
    fields.push("performed_by = ?");
    values.push(updates.performed_by);
  }

  if (fields.length === 0) {
    throw new Error("No valid fields to update");
  }

  // 3. Calculate inventory adjustments
  const productId = updates.product_id || existing.product_id;
  
  // Get current product quantity
  const [[product]] = await pool.query(
    "SELECT current_quantity FROM products WHERE id = ?", 
    [productId]
  );
  
  if (!product) {
    throw new Error("Product not found");
  }

  // Calculate the net effect of the changes
  let netQuantityChange = 0;
  const isAdjustmentChange = existing.transaction_type === "adjustment" || 
                           (updates.transaction_type && updates.transaction_type === "adjustment");

  // Case 1: Transaction type changed
  if (updates.transaction_type && updates.transaction_type !== existing.transaction_type) {
    // Reverse old transaction effect
    if (existing.transaction_type === "inbound") {
      netQuantityChange -= existing.quantity;
    } else if (existing.transaction_type === "outbound") {
      netQuantityChange += existing.quantity;
    } else if (existing.transaction_type === "adjustment") {
      netQuantityChange -= existing.quantity; // Reverse old adjustment
    }

    // Apply new transaction effect
    const newQty = updates.quantity !== undefined ? updates.quantity : existing.quantity;
    if (updates.transaction_type === "inbound") {
      netQuantityChange += newQty;
    } else if (updates.transaction_type === "outbound") {
      netQuantityChange -= newQty;
    } else if (updates.transaction_type === "adjustment") {
      netQuantityChange += newQty; // Apply new adjustment
    }
  }
  // Case 2: Only quantity changed (same type)
  else if (updates.quantity !== undefined && updates.quantity !== existing.quantity) {
    const diff = updates.quantity - existing.quantity;
    
    if (existing.transaction_type === "inbound") {
      netQuantityChange += diff;
    } else if (existing.transaction_type === "outbound") {
      netQuantityChange -= diff;
    } else if (existing.transaction_type === "adjustment") {
      netQuantityChange += diff; // Adjustment difference
    }
  }

  // 4. Validate inventory (skip negative check for pure adjustment changes)
  if (!isAdjustmentChange && product.current_quantity + netQuantityChange < 0) {
    throw new Error("Insufficient stock - resulting quantity would be negative");
  }

  // 5. Execute as a transaction
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Update product inventory if needed
    if (netQuantityChange !== 0) {
      await connection.query(
        "UPDATE products SET current_quantity = current_quantity + ? WHERE id = ?",
        [netQuantityChange, productId]
      );
    }

    // Update the transaction record
    if (fields.length > 0) {
      await connection.query(
        `UPDATE stock_transactions SET ${fields.join(", ")} WHERE id = ?`,
        [...values, id]
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  // 6. Return updated transaction
  return getStockTransaction(id);
}
export async function patchProduct(id, updates) {
  // 1. Fetch existing product
  const [existingRows] = await pool.query(
    "SELECT * FROM products WHERE id = ?",
    [id]
  );
  
  if (existingRows.length === 0) {
    throw new Error("Product not found");
  }
  
  const existing = existingRows[0];

  // 2. Validate updates and build update fields
  const fields = [];
  const values = [];
  
  if (updates.name !== undefined) {
    if (!updates.name.trim()) {
      throw new Error("Product name cannot be empty");
    }
    fields.push("name = ?");
    values.push(updates.name.trim());
  }
  
  if (updates.category_id !== undefined) {
    // Verify category exists
    const [categoryRows] = await pool.query(
      "SELECT id FROM categories WHERE id = ?",
      [updates.category_id]
    );
    
    if (categoryRows.length === 0) {
      throw new Error("Category not found");
    }
    
    fields.push("category_id = ?");
    values.push(updates.category_id);
  }
  
  if (updates.unit_price !== undefined) {
    const price = parseFloat(updates.unit_price);
    if (isNaN(price)) {
      throw new Error("Unit price must be a number");
    }
    if (price < 0) {
      throw new Error("Unit price cannot be negative");
    }
    fields.push("unit_price = ?");
    values.push(price);
  }
  
  if (updates.current_quantity !== undefined) {
    const quantity = parseInt(updates.current_quantity);
    if (isNaN(quantity)) {
      throw new Error("Current quantity must be a number");
    }
    fields.push("current_quantity = ?");
    values.push(quantity);
  }
  
  if (updates.initial_quantity !== undefined) {
    const initialQty = parseInt(updates.initial_quantity);
    if (isNaN(initialQty)) {
      throw new Error("Initial quantity must be a number");
    }
    if (initialQty < 0) {
      throw new Error("Initial quantity cannot be negative");
    }
    fields.push("initial_quantity = ?");
    values.push(initialQty);
  }

  if (fields.length === 0) {
    throw new Error("No valid fields to update");
  }

  // 3. Execute the update
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Update the product
    await connection.query(
      `UPDATE products SET ${fields.join(", ")} WHERE id = ?`,
      [...values, id]
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  // 4. Return updated product
  return getProductById(id);
}
// Partially update a card (PATCH - updates only provided fields)
export async function patchCard(id, updates) {
  const fields = [];
  const values = [];

  if (updates.firstname) {
      fields.push("firstname = ?");
      values.push(updates.firstname);
  }
  if (updates.lastname) {
      fields.push("lastname = ?");
      values.push(updates.lastname);
  }
  if (updates.status) {
      fields.push("status = ?");
      values.push(updates.status);
  }
//   if (updates.email) {
//     fields.push("email = ?");
//     values.push(updates.email);
// }
if (updates.nrc) {
  fields.push("nrc = ?");
  values.push(updates.nrc);
}
if (updates.type) {
  fields.push("type = ?");
  values.push(updates.type);
}
if (updates.field_of_study) {
  fields.push("field_of_study = ?");
  values.push(updates.field_of_study);
}
  if (fields.length === 0) {
      throw new Error("No valid fields to update");
  }

  values.push(id); // Add ID at the end
  await pool.query(`UPDATE cards SET ${fields.join(", ")} WHERE id = ?`, values);
  return getCard(id); // Return the updated card
}

// Delete a card
export async function deleteCard(id) {
  const card = await getCard(id); // Fetch the card before deleting (to return it)
  if (!card) return null; // If no card exists, return null

  await pool.query("DELETE FROM cards WHERE id = ?", [id]);
  return card; // Return the deleted card
}
//.................................................................renewals
// Add these functions to database.js

// Create a renewal record
export async function createRenewal(cardId, receiptId, userId) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Create the renewal record
    const [result] = await connection.query(`
      INSERT INTO renewals (card_id, receipt_id, renewed_by)
      VALUES (?, ?, ?)
    `, [cardId, receiptId, userId]);
    
    // 2. Update the card's receipt_id and expiration date
    await connection.query(`
      UPDATE cards 
      SET receipt_id = ?, 
          expires_at = DATE_ADD(CURDATE(), INTERVAL 1 YEAR)
      WHERE id = ?
    `, [receiptId, cardId]);
    
    await connection.commit();
    return result.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Get all renewals for a card
export async function getRenewalsByCardId(cardId) {
  const [rows] = await pool.query(`
    SELECT r.*, rc.filename, rc.filepath, u.firstname, u.lastname
    FROM renewals r
    JOIN receipts rc ON r.receipt_id = rc.id
    JOIN users u ON r.renewed_by = u.id
    WHERE r.card_id = ?
    ORDER BY r.renewed_at DESC
  `, [cardId]);
  return rows;
}

// Check if card exists by NRC
export async function getCardByNrc(nrc) {
  const [rows] = await pool.query(`
    SELECT * FROM cards WHERE nrc = ?
  `, [nrc]);
  return rows[0];
}
//.................................................................renewals
//.........................user management
// Get all users
export async function getUsers() {
  const [rows] = await pool.query("SELECT * FROM users");
  return rows;
}

// Update a user's role
export async function updateUserRole(id, role) {
  await pool.query("UPDATE users SET role = ? WHERE id = ?", [role, id]);
  return getUser(id); // Return the updated user
}

// Delete a user
export async function deleteUser(id) {
  const user = await getUser(id); // Fetch the user before deleting (to return it)
  if (!user) return null; // If no user exists, return null

  await pool.query("DELETE FROM users WHERE id = ?", [id]);
  return user; // Return the deleted user
}

// Get a single user by ID
export async function getUser(id) {
  const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
  return rows[0];
}

// Function to update isLoggedIn and lastActive
export async function updateUserLoginStatus(userId, isLoggedIn) {
  try {
    await pool.query(
      "UPDATE users SET isLoggedIn = ?, lastActive = CURRENT_TIMESTAMP WHERE id = ?",
      [isLoggedIn, userId]
    );
    console.log(`User ${userId} login status updated to ${isLoggedIn}`);
  } catch (error) {
    console.error("Error updating user login status:", error);
    throw error; // Re-throw the error to handle it in the route
  }
}
//.........................user management

