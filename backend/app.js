
// backend express server
import express from 'express'
import cors from 'cors'
import { 
  getStockTransactions,
  getStockTransaction,
  getRecentStockTransactions,
  getInboundStockTransactions,
  getInboundTransactions,
  getOutboundStockTransactions,
  getStockTransactionCounts,
  getProducts, getProductById,
  patchStockTransaction,
  patchProduct,
  deleteProduct,
  deleteStockTransaction,
  getCategories, getOutboundByProduct, getOutboundStats, getOutboundOverTime,
  createProduct, getProductsForDropdown, getSuppliersForDropdown, addSupplier, getStockTransactionStats, getDepartments, createStockTransaction, getInboundStats,
  getLast7DaysStockData
} from "./database.js";
import { getLast7DaysData, getPendingOverTimeData, getPendingByFieldData, getCollectedByMonthData, getCollectedByDayData, checkNrcExists, getUsers, updateUserRole, deleteUser} from './database.js'
import authRoutes from './routes/authRoutes.js'; // Import authRoutes
import { authenticateToken } from './middleware/authMiddleware.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';


const app = express()

// Enable CORS for all origins
app.use(cors())

app.use(express.json())

// Middleware to check if the user is an admin
export const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admin privileges required." });
  }
  next();
};

app.get('/', (req, res) => {
    console.log("req.body")
})
//.................................................................................receipt
// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

// Ensure the uploads directory exists
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
// Upload receipt endpoint new
app.post('/upload-receipt', authenticateToken, upload.single('receipt'), async (req, res) => {

  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const { filename, path: filepath } = req.file;
  const uploadedBy = req.user.userId;
  console.log("Received request body:", uploadedBy); // 🔍 Check request body
  try {
    const receiptId = await insertReceipt(filename, filepath, uploadedBy);
    res.status(201).json({ id: receiptId, filename, filepath, uploadedBy });
  } catch (error) {
    console.error('Error uploading receipt:', error);
    res.status(500).json({ message: 'Error uploading receipt' });
  }
});
// // Upload receipt endpoint
// app.post('/upload-receipt', authenticateToken, upload.single('receipt'), async (req, res) => {
//   if (!req.file) {
//     return res.status(400).json({ message: 'No file uploaded' });
//   }

//   const { filename, path: filepath } = req.file;
//   const uploadedBy = req.user.id;

//   try {
//     const receiptId = await insertReceipt(filename, filepath, uploadedBy); // Use the new function
//     res.status(201).json({ id: receiptId, filename, filepath });
//   } catch (error) {
//     console.error('Error uploading receipt:', error);
//     res.status(500).json({ message: 'Error uploading receipt' });
//   }
// });
// Get recent receipts endpoint login taken to database.js
app.get('/receipts', authenticateToken, async (req, res) => {
  const { search } = req.query;
  try {
    const receipts = await getRecentReceipts(search);
    res.json(receipts);
    // console.log("almost there",receipts);
  } catch (error) {
    console.error('Error fetching receipts:', error);
    res.status(500).json({ message: 'Error fetching receipts' });
  }
});
// Get receipt endpoint
app.get('/receipts/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const receipt = await getReceiptById(id); // Use the new function
    if (!receipt) {
      return res.status(404).json({ message: 'Receipt not found' });
    }

    res.sendFile(path.resolve(receipt.filepath));
  } catch (error) {
    console.error('Error fetching receipt:', error);
    res.status(500).json({ message: 'Error fetching receipt' });
  }
});
//.................................................................................receipt

app.use('/auth', authRoutes); // Mount the authentication routes

// Add route to get the counts of cards
// Get card counts
app.get("/cards/count", authenticateToken, async (req, res) => {
  const { total, pending, collected } = await getCardCounts();
  res.json({ total, pending, collected });
});

// Totalrecords infomatics code
// Totalrecords infomatics code
app.get("/cards/last7days", authenticateToken, async (req, res) => {
  try {
    const result = await getLast7DaysData();
    
    // Convert each date in the result to the local timezone
    const convertedResult = result.map(row => {
      const localDate = new Date(row.day); // Converts UTC to local time
      row.day = localDate.toLocaleDateString(); // You can use toLocaleString() if you want time as well
      return row;
    });
    
    res.json(convertedResult);
  } catch (error) {
    console.error("Error fetching last 7 days data:", error);
    res.status(500).send({ message: "Error fetching last 7 days data" });
  }
});
// Pending over time infomatics code
// Pending over time route
app.get("/cards/pending-over-time", authenticateToken, async (req, res) => {
  try {
    const result = await getPendingOverTimeData();
    
    // Convert each date in the result to the local timezone
    const convertedResult = result.map(row => {
      const localDate = new Date(row.day); // Converts UTC to local time
      row.day = localDate.toLocaleDateString(); // You can use toLocaleString() if you want time as well
      return row;
    });
    
    res.json(convertedResult);
  } catch (error) {
    console.error("Error fetching pending records over time:", error);
    res.status(500).send({ message: "Error fetching pending records over time" });
  }
});
// Pending by field infomatics code
// Pending by field infomatics code
app.get("/cards/pending-by-field", authenticateToken, async (req, res) => {
  try {
    const result = await getPendingByFieldData();
    
    // Convert each date in the result to the local timezone
    const convertedResult = result.map(row => {
      const localDate = new Date(row.day); // Converts UTC to local time
      row.day = localDate.toLocaleDateString(); // You can use toLocaleString() if you want time as well
      return row;
    });
    
    res.json(convertedResult);
  } catch (error) {
    console.error("Error fetching pending records by field:", error);
    res.status(500).send({ message: "Error fetching pending records by field" });
  }
});
// Collected by month infomatics code
app.get("/cards/collected-by-month", authenticateToken, async (req, res) => {
  try {
    const result = await getCollectedByMonthData(); // You need to implement this function in your database.js
    res.json(result);
  } catch (error) {
    console.error("Error fetching collected records by month:", error);
    res.status(500).send({ message: "Error fetching collected records by month" });
  }
});
// Collected by day infomatics code
// Collected by day infomatics code
app.get("/cards/collected-by-day", authenticateToken, async (req, res) => {
  try {
    const result = await getCollectedByDayData(); // You need to implement this function in your database.js
console.log("result", result);
    // Convert each date in the result to the local timezone
    const convertedResult = result.map(row => {
      // const localDate = new Date(row.date); // Converts UTC to local time
      // row.day = localDate.toLocaleDateString(); // You can use toLocaleString() if you want time as well
      row.day = row.day
      console.log("row.day", row.day)
      return row;
    });
    
    res.json(convertedResult);
  } catch (error) {
    console.error("Error fetching collected records by day:", error);
    res.status(500).send({ message: "Error fetching collected records by day" });
  }
});

// Get all cards
app.get("/cards", authenticateToken, async (req, res) => {
  const { status } = req.query; // e.g., 'pending', 'collected', or undefined
  try {
    const cards = await getCards(status); // Pass status to DB function
    res.send(cards);
  } catch (error) {
    console.error("Failed to get cards:", error);
    res.status(500).send("Error fetching cards");
  }
});
//.........................................................................................................stock transactions
// Get all stock transactions
app.get("/stock-transactions", authenticateToken, async (req, res) => {
  const { transaction_type } = req.query; // e.g., 'inbound', 'outbound', 'adjustment', or undefined
  try {
    const transactions = await getStockTransactions(req.query); // Pass optional filter
    res.send(transactions);
  } catch (error) {
    console.error("Failed to get stock transactions:", error);
    res.status(500).send("Error fetching stock transactions");
  }
});

// Get stock transaction counts for dashboard
app.get("/stock-transactions/count", authenticateToken, async (req, res) => {
  try {
    const counts = await getStockTransactionCounts();
    res.send(counts);
    // console.log("Stock transaction counts fetched successfully:", counts);
  } catch (error) {
    console.error("Failed to get stock counts:", error);
    res.status(500).send("Error fetching stock counts");
  }
});

//stock transaction stats for trends
app.get("/stock-transactions/stats", authenticateToken, async (req, res) => {
  try {
    const stats = await getStockTransactionStats();
    res.json(stats);
    // console.log("Stock stats fetched successfully:", stats);
  } catch (error) {
    console.error("Error fetching stock stats:", error);
    res.status(500).json({ message: "Error fetching stock stats" });
  }
});
// Get recent stock transactions
app.get("/stock-transactions/recent", authenticateToken, async (req, res) => {
  try {
    const transactions = await getRecentStockTransactions();
    res.send(transactions);
  } catch (error) {
    console.error("Failed to get recent stock transactions:", error);
    res.status(500).send("Error fetching recent stock transactions");
  }
});

// Get inbound stock transactions
app.get("/stock-transactions/inbound", authenticateToken, async (req, res) => {
  try {
    const transactions = await getInboundStockTransactions();
    res.send(transactions);
  } catch (error) {
    console.error("Failed to get inbound stock:", error);
    res.status(500).send("Error fetching inbound stock");
  }
});

// Get outbound stock transactions
app.get("/stock-transactions/outbound", authenticateToken, async (req, res) => {
  try {
    const transactions = await getOutboundStockTransactions();
    res.send(transactions);
  } catch (error) {
    console.error("Failed to get outbound stock:", error);
    res.status(500).send("Error fetching outbound stock");
  }
});

// Delete stock transaction
app.delete("/stock-transactions/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    await deleteStockTransaction(req.params.id);
    res.status(200).json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    res.status(500).json({ message: "Error deleting transaction" });
  }
});

// Get document
app.get("/documents/:id", authenticateToken, async (req, res) => {
  try {
    const document = await getDocumentById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }
    
    // Assuming documents are stored in the file system
    res.sendFile(path.resolve(document.filepath));
  } catch (error) {
    console.error("Error fetching document:", error);
    res.status(500).json({ message: "Error fetching document" });
  }
});

// Get last 7 days stock data
app.get("/stock-transactions/last7days", authenticateToken, async (req, res) => {
  try {
    const data = await getLast7DaysStockData();
    res.json(data);
    console.log("Last 7 days data fetched successfully:", data);
  } catch (error) {
    console.error("Error fetching last 7 days data:", error);
    res.status(500).json({ message: "Error fetching last 7 days data" });
  }
});
//...............................inbound stock
// Add these routes to your app.js

// Get inbound stock over time
app.get("/stock-transactions/inbound-over-time", authenticateToken, async (req, res) => {
  try {
    const data = await getInboundOverTime();
    res.json(data);
  } catch (error) {
    console.error("Error fetching inbound over time:", error);
    res.status(500).json({ message: "Error fetching inbound over time" });
  }
});

// Get inbound by product
app.get("/stock-transactions/inbound-by-product", authenticateToken, async (req, res) => {
  try {
    const data = await getInboundByProduct();
    res.json(data);
  } catch (error) {
    console.error("Error fetching inbound by product:", error);
    res.status(500).json({ message: "Error fetching inbound by product" });
  }
});

// Get inbound stats
app.get("/stock-transactions/inbound-stats", authenticateToken, async (req, res) => {
  try {
    const stats = await getInboundStats();
    res.json(stats);
  } catch (error) {
    console.error("Error fetching inbound stats:", error);
    res.status(500).json({ message: "Error fetching inbound stats" });
  }
});

// Get all inbound transactions
app.get("/stock-transactions/inbound", authenticateToken, async (req, res) => {
  try {
    const transactions = await getInboundTransactions();
    res.json(transactions);
  } catch (error) {
    console.error("Error fetching inbound transactions:", error);
    res.status(500).json({ message: "Error fetching inbound transactions" });
  }
});
//...............................inbound stock
//...............................outbound stock
// Add these routes to your app.js

// Get outbound stock over time
app.get("/stock-transactions/outbound-over-time", authenticateToken, async (req, res) => {
  try {
    const data = await getOutboundOverTime();
    res.json(data);
  } catch (error) {
    console.error("Error fetching outbound over time:", error);
    res.status(500).json({ message: "Error fetching outbound over time" });
  }
});

// Get outbound by product
app.get("/stock-transactions/outbound-by-product", authenticateToken, async (req, res) => {
  try {
    const data = await getOutboundByProduct();
    res.json(data);
  } catch (error) {
    console.error("Error fetching outbound by product:", error);
    res.status(500).json({ message: "Error fetching outbound by product" });
  }
});

// Get outbound stats
app.get("/stock-transactions/outbound-stats", authenticateToken, async (req, res) => {
  try {
    const stats = await getOutboundStats();
    res.json(stats);
  } catch (error) {
    console.error("Error fetching outbound stats:", error);
    res.status(500).json({ message: "Error fetching outbound stats" });
  }
});

// Get all outbound transactions
app.get("/stock-transactions/outbound", authenticateToken, async (req, res) => {
  try {
    const transactions = await getOutboundTransactions();
    res.json(transactions);
  } catch (error) {
    console.error("Error fetching outbound transactions:", error);
    res.status(500).json({ message: "Error fetching outbound transactions" });
  }
});
//...............................outbound stock
// Add these routes to your app.js

// Get single stock transaction
app.get("/stock-transactions/:id", authenticateToken, async (req, res) => {
  try {
    const transaction = await getStockTransaction(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    res.json(transaction);
    // console.log("Transaction fetched successfully:", transaction);
  } catch (error) {
    console.error("Error fetching transaction:", error);
    res.status(500).json({ message: "Error fetching transaction" });
  }
});
//..............................products
// Add these routes to your app.js

// Get all products
app.get("/products", authenticateToken, async (req, res) => {
  try {
    const products = await getProducts();
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Error fetching products" });
  }
});

// Get single product
app.get("/products/:id", authenticateToken, async (req, res) => {
  try {
    const product = await getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Error fetching product" });
  }
});

// Update a product
app.put("/products/:id", authenticateToken, async (req, res) => {
  try {
    const updatedProduct = await updateProduct(req.params.id, req.body);
    res.json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Error updating product" });
  }
});

// Delete a product
app.delete("/products/:id", authenticateToken, async (req, res) => {
  try {
    const success = await deleteProduct(req.params.id);
    if (!success) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Error deleting product" });
  }
});
//.................add product
// Add these routes to your app.js

// Get all categories
app.get('/categories', authenticateToken, async (req, res) => {
  try {
    const categories = await getCategories();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Error fetching categories' });
  }
});

// Create a new product
app.post('/products', authenticateToken, async (req, res) => {
  try {
    const { name, category_id, unit_price } = req.body;
    const added_by = req.user.userId; // Assuming your auth middleware adds userId to req.user

    if (!name || !category_id || unit_price === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const productId = await createProduct(name, category_id, unit_price, added_by);
    res.status(201).json({ id: productId, message: 'Product created successfully' });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Error creating product' });
  }
});
//.................add product
//..............................products
//..............................add inbound stock transactions
// Add these routes to your app.js

// Get products for dropdown
app.get("/products-dropdown", authenticateToken, async (req, res) => {
  try {
    const products = await getProductsForDropdown();
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Error fetching products" });
  }
});

// Get suppliers for dropdown
app.get("/suppliers", authenticateToken, async (req, res) => {
  try {
    const suppliers = await getSuppliersForDropdown();
    res.json(suppliers);
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    res.status(500).json({ message: "Error fetching suppliers" });
  }
});

// Add new supplier
app.post("/suppliers", authenticateToken, async (req, res) => {
  try {
    const supplier = await addSupplier(req.body);
    res.status(201).json(supplier);
  } catch (error) {
    console.error("Error adding supplier:", error);
    res.status(500).json({ message: "Error adding supplier" });
  }
});
//..............................add inbound stock transactions
// Create a stock transaction (inbound, outbound, or adjustment)
//both inbound and outbound transaction logic here
app.post("/stock-transactions", authenticateToken, async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const transactionId = await createStockTransaction({
      ...req.body,
      performed_by: req.user.userId
    });

    res.status(201).json({ id: transactionId });
    
  } catch (error) {
    console.error("Error creating stock transaction:", error);
    res.status(500).json({ message: "Error creating stock transaction" });
  }
});

//..............................add outbound stock transactions
// Add this route to get departments
app.get('/departments', authenticateToken, async (req, res) => {
  try {
    const departments = await getDepartments();
    res.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ message: 'Error fetching departments' });
  }
});
//...............................add outbound stock transactions
//............................................................................................................stock transactions
// Get a single card by ID
app.get("/cards/:id", authenticateToken, async (req, res) => {
  const id = req.params.id
  const card = await getCard(id)
  res.send(card)
})

// Create a new card
app.post("/cards", authenticateToken, async (req, res) => {
  console.log("Received request body:", req.body); // 🔍 Check request body
  const { firstname, lastname, /*email,*/ nrc, type, field_of_study, userId, receipt_id} = req.body

  //
    console.log("Received request to create card:", { firstname, lastname, /*email,*/ nrc, type, field_of_study, userId, receipt_id}); // Log request payload
  
  // 
  const card = await createCard(firstname, lastname, /*email,*/ nrc, type, field_of_study, userId, receipt_id)
  res.status(201).send(card)
})
// Get notifications for the authenticated user
app.get("/notifications", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id; // Assuming the user ID is stored in the token
    const notifications = await getNotifications(userId);
    res.json(notifications);
    // console.log("Notifications:", notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).send({ message: "Error fetching notifications" });
  }
});

// Mark a notification as read
app.patch("/notifications/:id/read", authenticateToken, async (req, res) => {
  try {
    const notificationId = req.params.id;
    await markNotificationAsRead(notificationId);
    res.status(200).send({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).send({ message: "Error marking notification as read" });
  }
});

// In your Express server, handle the duplicate check
app.post("/check-duplicate", authenticateToken, async (req, res) => {
  const { email, nrc } = req.body;
  
  try {
    //const emailExists = await checkEmailExists(email);
    const nrcExists = await checkNrcExists(nrc);

    // if (emailExists) {
    //   return res.json({ exists: true, field: "email" });
    // }
    
    if (nrcExists) {
      return res.json({ exists: true, field: "nrc" });
    }

    return res.json({ exists: false });
  } catch (error) {
    console.error("Error checking duplicates:", error);
    res.status(500).send({ message: "Error checking duplicates" });
  }
});

// Update a card (PUT - replaces all fields)
app.put("/cards/:id", authenticateToken, isAdmin, async (req, res) => {
  const id = req.params.id
  const { firstname, lastname, status, /*email,*/ nrc, type, field_of_study} = req.body
  try {
    const updatedCard = await updateCard(id, firstname, lastname, status, /*email,*/ nrc, type, field_of_study)
    res.send(updatedCard)
  } catch (err) {
    res.status(400).send({ message: "Error updating card" })
  }
})
app.patch("/stock-transactions/:id", authenticateToken, isAdmin, async (req, res) => {
  const id = req.params.id;
  const updates = req.body;

  try {
    const updatedTransaction = await patchStockTransaction(id, updates);
    res.send(updatedTransaction);
  } catch (err) {
    console.error("Error updating stock transaction:", err);
    res.status(400).send({ message: "Error updating stock transaction" });
  }
});

app.patch("/products/:id", authenticateToken, isAdmin, async (req, res) => {
  const id = req.params.id;
  const updates = req.body;

  try {
    const updatedProduct = await patchProduct(id, updates);
    res.send(updatedProduct);
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(400).send({ message: "Error updating product" });
  }
});
//..............................................user amanagement
// Example Express.js routes for user management
// Get all users
app.get("/users", authenticateToken, async (req, res) => {
  try {
    const users = await getUsers();
    res.send(users);
  } catch (error) {
    res.status(500).send({ message: "Error fetching users" });
  }
});

// Update a user's role
app.patch("/users/:id", authenticateToken, isAdmin, async (req, res) => {
  const id = req.params.id;
  const { role } = req.body;
  try {
    const updatedUser = await updateUserRole(id, role);
    res.send(updatedUser);
  } catch (error) {
    res.status(400).send({ message: "Error updating user role" });
  }
});

// Delete a user
app.delete("/users/:id", authenticateToken, isAdmin, async (req, res) => {
  const id = req.params.id;
  try {
    const deletedUser = await deleteUser(id);
    if (!deletedUser) {
      res.status(404).send({ message: "User not found" });
    } else {
      res.send(deletedUser);
    }
  } catch (error) {
    res.status(400).send({ message: "Error deleting user" });
  }
});
//..............................................user amanagement

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send('Something broke 💩')
})

app.listen(8080, () => {
  console.log('Server is running on port 8080')
})
