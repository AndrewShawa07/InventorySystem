import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createUser, getUserByEmail, updateUserLoginStatus } from '../database.js';

const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
  const { firstname, lastname, email, password } = req.body;

  // Check if email already exists
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    return res.status(400).json({ message: 'Email already in use' });
  }

  // Hash the password before saving
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('hashed password: ', hashedPassword);

    // Create new user
    const newUser = await createUser(firstname, lastname, email, hashedPassword);
    console.log('new user: ', newUser);
    res.status(201).json({ message: 'User registered successfully', user: newUser });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Error registering user' });
  }
});

// Login an existing user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Check if email exists
  const user = await getUserByEmail(email);
  if (!user) {
    return res.status(400).json({ message: 'Email not found' });
  }

  // Compare passwords
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    console.log(password, user.password);
    return res.status(400).json({ message: 'Incorrect password' });
  }

  // Update isLoggedIn and lastActive
  await updateUserLoginStatus(user.id, true);

  // Generate JWT
  const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '10h' });
  
  res.json({ 
    message: 'Login successful', 
    token, 
    user: {
      id: user.id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role: user.role
    }
  });
});

//Moved logout route outside the login route
router.post('/logout', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    // Update isLoggedIn to false
    await updateUserLoginStatus(userId, false);

    res.json({ message: "Logout successful" });
    console.log('logout successful');
  } catch (err) {
    console.error("Error logging out:", err);
    res.status(500).json({ message: "Error logging out" });
  }
});

export default router;
