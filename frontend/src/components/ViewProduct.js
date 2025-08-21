import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Edit, Trash2, Box, Tag, Database, Clock, DollarSign, Layers, User, CalendarDays } from "lucide-react";
import { FaArrowLeft, FaEye } from "react-icons/fa";
import { useContext } from 'react';
import { SidebarContext } from '../context/SidebarContext';

function ViewProduct() {
  const { isSidebarOpen, isCollapsed } = useContext(SidebarContext);
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [transactions, setTransactions] = useState([]);
  const navigate = useNavigate();
  const role = localStorage.getItem("role");
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);

// In the useEffect where data is fetched:
useEffect(() => {
  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // Fetch all data in parallel
      const [productRes, categoriesRes, usersRes, transactionsRes] = await Promise.all([
        axios.get(`http://localhost:8080/products/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`http://localhost:8080/categories`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`http://localhost:8080/users`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        // Add product_id filter to only get transactions for this product
        axios.get(`http://localhost:8080/stock-transactions?product_id=${id}&limit=5`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
console.log("Select transactions gotten:", transactionsRes.data);
      setProduct(productRes.data);
      setCategories(categoriesRes.data);
      setUsers(usersRes.data);
      setTransactions(transactionsRes.data);

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [id]);


  // Helper functions to get names
  const getCategoryName = () => {
    const category = categories.find(c => c.id === product.category_id);
    return category ? category.name : `Category ID: ${product.category_id}`;
  };

  const getAddedByName = () => {
    const user = users.find(u => u.id === product.added_by);
    return `${user?.firstname} ${user?.lastname}`.trim() || `User ID: ${product.added_by}`;
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:8080/products/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      navigate("/view-products");
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const handleViewTransaction = (transactionId) => {
    navigate(`/view-stock-transaction/${transactionId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="bg-white p-6 rounded-lg shadow-md text-center max-w-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Product Not Found</h2>
          <p className="text-gray-600 mb-4">The requested product could not be found.</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const getStockStatus = () => {
    if (product.current_quantity <= 0) {
      return { text: "Out of Stock", color: "bg-red-100 text-red-800" };
    } else if (product.current_quantity < (product.initial_quantity * 0.2)) {
      return { text: "Low Stock", color: "bg-yellow-100 text-yellow-800" };
    } else {
      return { text: "In Stock", color: "bg-green-100 text-green-800" };
    }
  };

  const stockStatus = getStockStatus();

  return (
    <div className={`min-h-screen bg-gray-50 pt-16 pb-8 px-4 sm:px-6 lg:px-8 transition-all duration-300 ${
      isSidebarOpen ? (isCollapsed ? 'ml-16' : 'ml-64') : 'ml-0'
    }`}>
      <div className="max-w-4xl mx-auto">
        {/* Header with Back Button */}
        <div className="flex items-center mb-6">
          <button 
            onClick={() => navigate(-1)} 
            className="mr-4 p-2 rounded-full hover:bg-gray-200"
          >
            <FaArrowLeft className="text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Product Details</h1>
        </div>

        {/* Product Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center">
              <Box className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-800 mb-1">
                  {product.name}
                </h1>
                <p className="text-gray-600">Product ID: {product.id}</p>
              </div>
            </div>
            <div className="mt-3 sm:mt-0">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${stockStatus.color}`}>
                {stockStatus.text}
              </span>
            </div>
          </div>
        </div>

        {/* Product Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100 flex items-center">
              <Tag className="w-5 h-5 mr-2 text-blue-500" />
              Basic Information
            </h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="w-5 h-5 text-gray-400 mr-3 mt-0.5">
                  <Database />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Category</p>
                  <p className="mt-1 text-gray-800">{getCategoryName()}</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-5 h-5 text-gray-400 mr-3 mt-0.5">
                  <User />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Added By</p>
                  <p className="mt-1 text-gray-800">{getAddedByName()}</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-5 h-5 text-gray-400 mr-3 mt-0.5">
                  <CalendarDays />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Date Created</p>
                  <p className="mt-1 text-gray-800">
                    {new Date(product.created_at).toLocaleDateString("en-GB", {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-green-500" />
              Pricing & Stock
            </h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="w-5 h-5 text-gray-400 mr-3 mt-0.5">
                  <DollarSign />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Unit Price</p>
                  <p className="mt-1 text-gray-800">
                    K{parseFloat(product.unit_price).toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-5 h-5 text-gray-400 mr-3 mt-0.5">
                  <Layers />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Current Stock</p>
                  <p className="mt-1 text-gray-800">
                    {product.current_quantity} units
                    {product.initial_quantity > 0 && (
                      <span className="text-sm text-gray-500 ml-2">
                        (Initial: {product.initial_quantity})
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-5 h-5 text-gray-400 mr-3 mt-0.5">
                  <DollarSign />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Value</p>
                  <p className="mt-1 text-gray-800">
                    K{(product.unit_price * product.current_quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-lg font-semibold text-gray-800 flex items-center">
      <Clock className="w-5 h-5 mr-2 text-purple-500" />
      Recent Transactions for {product.name}
    </h2>
    {/* <Link 
      to={`/stock-manager?product_id=${product.id}`}
      className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
    >
      <span className="text-sm font-medium">View All</span>
      <FaEye className="h-4 w-4" />
    </Link> */}
  </div>
  
  <div className="overflow-auto max-h-32">
    <table className="w-full text-left">
      <thead>
        <tr className="border-b border-gray-200 text-gray-600 text-sm">
          <th className="pb-2 font-medium">Type</th>
          <th className="pb-2 font-medium">Quantity</th>
          <th className="pb-2 font-medium">Date</th>
          <th className="pb-2 font-medium">Remarks</th>
        </tr>
      </thead>
      <tbody>
        {transactions.length > 0 ? (
          transactions.slice(0, 5).map((transaction) => (
            <tr 
              key={transaction.id} 
              className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
              onClick={() => handleViewTransaction(transaction.id)}
            >
              <td className="py-3">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  transaction.transaction_type === "inbound" ? "bg-green-100 text-green-800" :
                  transaction.transaction_type === "outbound" ? "bg-red-100 text-red-800" :
                  "bg-blue-100 text-blue-800"
                }`}>
                  {transaction.transaction_type}
                </span>
              </td>
              <td className="py-3">{transaction.quantity}</td>
              <td className="py-3">
                {transaction.date 
                  ? new Date(transaction.date).toLocaleDateString("en-GB") 
                  : 'N/A'}
              </td>
              <td className="py-3 text-sm text-gray-500">
                {transaction.remarks || '—'}
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={4} className="py-4 text-center text-gray-500">
              No transactions found for this product
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
</div>

        {/* Action Buttons */}
        {role === "admin" && (
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={() => navigate(`/edit-product/${id}`)}
              className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Product
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </button>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Confirm Deletion</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete {product.name}? This will permanently remove the product and its inventory records.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                >
                  Delete Product
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ViewProduct;