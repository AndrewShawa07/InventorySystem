import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import StockManager from './components/StockManager';
import AddProduct from './components/AddProductPage';
import Register from './components/Register';
import Login from './components/Login';
import ViewTransaction from './components/ViewTransaction';
import AllStockPage from './components/AllStockPage';
import InboundStock from './components/InboundStockPage';
import OutboundStock from './components/OutboundStockPage';
import Adjustments from './components/Adjustments';
import LandingPage from './components/LandingPage';
import UserManager from './components/UserManager';
import EditStockTransaction from "./components/EditStockTransaction"; // Import the EditCard component
import EditProduct from './components/EditProduct'; // Import the EditProduct component
import UploadReceipt from "./components/UploadReceipt";
import NrcLookupPage from './components/NrcLookupPage';
import RenewalPage from './components/RenewalPage';
import Products from './components/ProductsPage';
import AddInboundTransaction from './components/AddInboundTransactionPage';
import AddOutboundTransation from './components/AddOutboundTransactionPage';
import AddAdjustmentTransaction from './components/AddAdjustmentTransactionPage';
import ViewProduct from './components/ViewProduct';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


// Check if the user is authenticated
const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return !!token; // Returns true if token exists, false otherwise
};

// ProtectedRoute component
const ProtectedRoute = ({ element: Element, ...rest }) => {
  return isAuthenticated() ? <Element {...rest} /> : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Navigate to="/landing-page" />} />
        <Route path="/landing-page" element={<LandingPage />} />

        {/* Protected Routes */}
        <Route
          path="/*"
          element={
            <Layout>
              <Routes>
                <Route path="/stock-manager" element={<ProtectedRoute element={StockManager} />} />
                <Route path="/edit-stock-transaction/:id" element={<ProtectedRoute element={EditStockTransaction} />} />
                <Route path="/edit-product/:id" element={<ProtectedRoute element={EditProduct} />} />
                <Route path="/add-product" element={<ProtectedRoute element={AddProduct} />} />
                <Route path="/all-stock" element={<ProtectedRoute element={AllStockPage} />} />
                <Route path="/inbound-stock" element={<ProtectedRoute element={InboundStock} />} />
                <Route path="/outbound-stock" element={<ProtectedRoute element={OutboundStock} />} />
                <Route path="/adjustments" element={<ProtectedRoute element={Adjustments} />} />
                <Route path="/view-stock-transaction/:id" element={<ProtectedRoute element={ViewTransaction} />} />
                <Route path="/user-manager" element={<ProtectedRoute element={UserManager} />} />
                <Route path="/upload-receipt" element={<ProtectedRoute element={UploadReceipt} />} />
                <Route path="/renew-member" element={<ProtectedRoute element={NrcLookupPage} />} />
                <Route path="/renew-card/:id" element={<ProtectedRoute element={RenewalPage} />} />
                <Route path="/view-products" element={<ProtectedRoute element={Products} />} />
                <Route path="/add-inbound-transaction" element={<ProtectedRoute element={AddInboundTransaction} />} />
                <Route path="/add-outbound-transaction" element={<ProtectedRoute element={AddOutboundTransation} />} />
                <Route path="/add-adjustment-transaction" element={<ProtectedRoute element={AddAdjustmentTransaction} />} />
                <Route path="/view-product/:id" element={<ProtectedRoute element={ViewProduct} />} />
                {/* // In your main App.js or routing file
<Route path="/renew-member" element={<NrcLookupPage />} />
<Route path="/renew-card/:id" element={<RenewalPage />} /> */}
              </Routes>
            </Layout>
          }
        />
      </Routes>
      {/* ToastContainer for notifications */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </Router>
  );
}

export default App;