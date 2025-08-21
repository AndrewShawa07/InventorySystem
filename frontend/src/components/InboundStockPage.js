import React, { useEffect, useState, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend as ChartLegend } from "chart.js";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaSearch, FaArrowLeft, FaBox, FaBoxes, FaDollarSign, FaCalendarAlt, FaWarehouse } from "react-icons/fa";
import { FiTrendingUp, FiTrendingDown } from "react-icons/fi";
import { useContext } from 'react';
import { SidebarContext } from '../context/SidebarContext';

ChartJS.register(ArcElement, ChartTooltip, ChartLegend);

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF'];

const InboundStockPage = () => {
  const { isSidebarOpen, isCollapsed } = useContext(SidebarContext);
  const [inboundOverTimeData, setInboundOverTimeData] = useState([]);
  const [inboundByProductData, setInboundByProductData] = useState([]);
  const [inboundTransactions, setInboundTransactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("date-newest");
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalQuantity: 0,
    totalValue: 0,
    avgValue: 0,
    topSuppliers: [],
    recentInbound: []
  });
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  const isAuthenticated = useCallback(() => {
    const token = localStorage.getItem("token");
    return !!token;
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      
      // Fetch all inbound transactions
      const transactionsResponse = await axios.get("http://localhost:8080/stock-transactions?transaction_type=inbound", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInboundTransactions(transactionsResponse.data);
      console.log("Inbound Transactions:", transactionsResponse.data);
      // Fetch inbound stats
      const statsResponse = await axios.get("http://localhost:8080/stock-transactions/inbound-stats", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Process the stats data
      const processedStats = {
        totalTransactions: parseInt(statsResponse.data.total) || 0,
        totalQuantity: parseInt(statsResponse.data.totalQuantity) || 0,
        totalValue: parseFloat(statsResponse.data.totalValue) || 0,
        avgValue: parseFloat(statsResponse.data.avgValue) || 0,
        topSuppliers: statsResponse.data.topSuppliers || [],
        recentInbound: transactionsResponse.data.slice(0, 4)
      };

      setStats(processedStats);

      // // Fetch inbound over time data
      // const overTimeResponse = await axios.get("http://localhost:8080/stock-transactions/inbound-over-time", {
      //   headers: { Authorization: `Bearer ${token}` },
      // });
      // setInboundOverTimeData(overTimeResponse.data);

      // // Fetch inbound by product data
      // const byProductResponse = await axios.get("http://localhost:8080/stock-transactions/inbound-by-product", {
      //   headers: { Authorization: `Bearer ${token}` },
      // });
      // setInboundByProductData(byProductResponse.data);
      
    } catch (error) {
      console.error("Error fetching data:", error);
      if (error.response?.status === 401) {
        navigate("/login");
      }
    }
  }, [navigate]);

  const handleDelete = useCallback(async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:8080/stock-transactions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInboundTransactions(prev => prev.filter(t => t.id !== id));
      fetchData();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      if (error.response?.status === 401) {
        navigate("/login");
      }
    } finally {
      setShowDeletePopup(false);
    }
  }, [fetchData, navigate]);

  const confirmDelete = useCallback((id) => {
    setTransactionToDelete(id);
    setShowDeletePopup(true);
  }, []);

  const cancelDelete = useCallback(() => {
    setShowDeletePopup(false);
    setTransactionToDelete(null);
  }, []);

  const handleEdit = useCallback((id, e) => {
    e.stopPropagation();
    navigate(`/edit-stock-transaction/${id}`);
  }, [navigate]);

  const handleView = useCallback((id) => {
    navigate(`/view-stock-transaction/${id}`);
  }, [navigate]);

  const sortedTransactions = React.useMemo(() => {
    return [...inboundTransactions].sort((a, b) => {
      const dateA = new Date(a.date || 0);
      const dateB = new Date(b.date || 0);
      const valueA = a.quantity * (a.unit_price || 0);
      const valueB = b.quantity * (b.unit_price || 0);
      
      switch (sortOrder) {
        case "product-asc":
          return (a.product_name || '').localeCompare(b.product_name || '');
        case "product-desc":
          return (b.product_name || '').localeCompare(a.product_name || '');
        case "quantity-asc":
          return a.quantity - b.quantity;
        case "quantity-desc":
          return b.quantity - a.quantity;
        case "value-asc":
          return valueA - valueB;
        case "value-desc":
          return valueB - valueA;
        case "date-newest":
          return dateB - dateA;
        case "date-oldest":
          return dateA - dateB;
        default:
          return 0;
      }
    });
  }, [inboundTransactions, sortOrder]);

  const filteredTransactions = React.useMemo(() => {
    return sortedTransactions.filter((transaction) => {
      const productName = transaction.product_name || '';
      const supplierName = transaction.supplier_name || '';
      const quantity = transaction.quantity || 0;
      const unitPrice = transaction.unit_price || 0;
      const transactionDate = transaction.date 
        ? new Date(transaction.date).toLocaleDateString("en-GB") 
        : '';
      const value = (transaction.quantity * (transaction.unit_price || 0)).toFixed(2);

      return (
        productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transactionDate.includes(searchQuery) ||
        quantity.toString().includes(searchQuery) ||
        unitPrice.toString().includes(searchQuery) ||
        value.includes(searchQuery)
      );
    });
  }, [sortedTransactions, searchQuery]);

  useEffect(() => {
    if (isAuthenticated()) {
      fetchData();
    }
  }, [isAuthenticated, fetchData]);

  // Prepare data for top suppliers chart
  const topSuppliersData = React.useMemo(() => {
    if (!stats.topSuppliers || stats.topSuppliers.length === 0) return [];
  
    return stats.topSuppliers.map((supplier) => ({
      name: supplier.name,
      value: parseFloat(supplier.totalValue),
      transactionCount: supplier.transactionCount,
    }));
  }, [stats.topSuppliers]);
  

  return (
    <div className={`min-h-screen bg-gray-50 pt-16 pb-8 px-4 sm:px-6 lg:px-8 transition-all duration-300 ${
      isSidebarOpen ? (isCollapsed ? 'ml-16' : 'ml-64') : 'ml-0'
    }`}>
      {/* Delete Confirmation Popup */}
      {showDeletePopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center w-96">
            <h2 className="text-xl font-semibold mb-4">Confirm Deletion</h2>
            <p className="text-gray-700 mb-6">Are you sure you want to delete this inbound transaction?</p>
            <div className="flex justify-center space-x-4 mt-4">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(transactionToDelete)}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-8xl mx-auto">
        <div className="flex items-center mb-6">
          <button 
            onClick={() => navigate(-1)} 
            className="mr-4 p-2 rounded-full hover:bg-gray-200"
          >
            <FaArrowLeft className="text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Inbound Stock</h1>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column - Table (70% width) */}
          <div className="lg:w-[70%]">
            {/* Filters and Search */}
            <div className="bg-white p-4 rounded-lg shadow-lg mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Search Input */}
                <div className="relative flex-1 min-w-0">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search inbound transactions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                {/* Sort Dropdown */}
                <div className="relative flex-1 sm:flex-none sm:w-48">
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="product-asc">Product: A-Z</option>
                    <option value="product-desc">Product: Z-A</option>
                    <option value="quantity-asc">Quantity: Low-High</option>
                    <option value="quantity-desc">Quantity: High-Low</option>
                    <option value="value-asc">Value: Low-High</option>
                    <option value="value-desc">Value: High-Low</option>
                    <option value="date-newest">Date: Newest</option>
                    <option value="date-oldest">Date: Oldest</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex mb-6">
              <Link
                to="/add-inbound-transaction"
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-200 shadow-sm hover:shadow-md"
              >
                <FaBox className="w-5 h-5 mr-2" />
                Add New Inbound Stock
              </Link>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Inbound Transactions</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-600 text-sm">
                      <th className="pb-2 font-medium">Product</th>
                      <th className="pb-2 font-medium">Quantity</th>
                      <th className="pb-2 font-medium">Unit Price</th>
                      <th className="pb-2 font-medium">Total Value</th>
                      <th className="pb-2 font-medium">Supplier</th>
                      <th className="pb-2 font-medium">Date</th>
                      {/* {role === "admin" && <th className="pb-2 font-medium">Actions</th>} */}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.length > 0 ? (
                      filteredTransactions.map((transaction) => {
                        const totalValue = transaction.quantity * (transaction.unit_price || 0);
                        return (
                          <tr 
                            key={transaction.id} 
                            className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                            onClick={() => handleView(transaction.id)}
                          >
                            <td className="py-3">{transaction.product_name || 'N/A'}</td>
                            <td className="py-3">{transaction.quantity}</td>
                            <td className="py-3">K{Number(transaction.unit_price || 0).toFixed(2)}</td>
                            <td className="py-3">K{totalValue.toFixed(2)}</td>
                            <td className="py-3">{transaction.supplier_name || 'N/A'}</td>
                            <td className="py-3">
                              {transaction.date ? new Date(transaction.date).toLocaleDateString("en-GB") : 'N/A'}
                            </td>
                            {/* {role === "admin" && (
                              <td className="py-3">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={(e) => handleEdit(transaction.id, e)}
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      confirmDelete(transaction.id);
                                    }}
                                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            )} */}
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={role === "admin" ? 7 : 6} className="py-4 text-center text-gray-500">
                          No inbound transactions found matching your criteria
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column - Stats and Charts (30% width) */}
          <div className="lg:w-[30%] space-y-6">
                        {/* Top Suppliers */}
                        <motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, delay: 0.2 }}
  className="bg-white p-4 rounded-lg shadow-sm"
>
  {/* Header */}
  <div className="flex items-center justify-between mb-4">
  <h2 className="text-lg font-semibold text-right">Recent Inbound</h2>
    <h2 className="text-lg font-semibold">Top Suppliers</h2>
  </div>
  {/* Body Split */}
  <div className="flex flex-col lg:flex-row">
        {/* Left: Recent Inbound List */}
        <div className="lg:w-1/2 mt-6 lg:mt-0 pl-0 lg:pl-4">
      <div className="space-y-3">
        {stats.recentInbound.map((transaction) => (
          <div key={transaction.id} className="flex items-start">
            <div className="p-2 rounded-full bg-green-100 text-green-600 mr-3">
              <FiTrendingUp className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{transaction.product_name}</p>
              <p className="text-xs text-gray-500">
                {transaction.quantity} units • K{(
                  transaction.quantity * (transaction.unit_price || 0)
                ).toFixed(2)} •{" "}
                {transaction.date
                  ? new Date(transaction.date).toLocaleDateString("en-GB")
                  : "N/A"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
{/* Right: Pie Chart */}
<div className="lg:w-1/2 mt-6 lg:mt-0 pl-0 lg:pl-4 border-t lg:border-t-0 lg:border-l border-gray-200">
  {topSuppliersData.length > 0 ? (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={topSuppliersData}
            cx="50%"
            cy="50%"
            outerRadius={60} // Slightly larger than 40 for better visibility
            dataKey="value"
            nameKey="name"
            labelLine={false}
            // 👇 No text inside pie slices
            label={false}
          >
            {topSuppliersData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>

          {/* Tooltip on hover */}
          <Tooltip
            formatter={(value, name, props) => [
              `$${value.toFixed(2)}`,
              `Transactions: ${props.payload.transactionCount}`,
            ]}
          />

          {/* Legend below chart only */}
          <Legend
            verticalAlign="bottom"
            height={36}
            wrapperStyle={{ fontSize: '12px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  ) : (
    <div className="h-48 flex items-center justify-center text-gray-500">
      <p>No supplier data available</p>
    </div>
  )}
</div>
  </div>
</motion.div>
            {/* Summary Stats Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-indigo-950 p-5 rounded-lg shadow-md text-white"
            >
              <h2 className="text-lg font-semibold mb-4">Inbound Summary</h2>
              <div className="grid grid-cols-2 gap-3">
                {/* Total Inbound */}
                <div className="p-3 bg-green-500 rounded-md">
                  <div className="flex items-center">
                    <FaBox className="w-4 h-4 mr-2 text-green-800" />
                    <span className="text-sm">Total Inbound</span>
                  </div>
                  <p className="font-semibold mt-1 text-xl">
                    {stats.totalTransactions}
                  </p>
                </div>
                {/* Total Quantity */}
                <div className="p-3 bg-blue-500 rounded-md">
                  <div className="flex items-center">
                    <FaBoxes className="w-4 h-4 mr-2 text-blue-800" />
                    <span className="text-sm">Total Quantity</span>
                  </div>
                  <p className="font-semibold mt-1 text-xl">
                    {stats.totalQuantity}
                  </p>
                </div>
                {/* Total Value */}
                <div className="p-3 bg-purple-500 rounded-md">
                  <div className="flex items-center">
                    <FaDollarSign className="w-4 h-4 mr-2 text-purple-800" />
                    <span className="text-sm">Total Value</span>
                  </div>
                  <p className="font-semibold mt-1 text-xl">
                    K{stats.totalValue?.toFixed(2) || '0.00'}
                  </p>
                </div>
                {/* Avg Value */}
                <div className="p-3 bg-orange-500 rounded-md">
                  <div className="flex items-center">
                    <FaCalendarAlt className="w-4 h-4 mr-2 text-orange-800" />
                    <span className="text-sm">Avg. Value</span>
                  </div>
                  <p className="font-semibold mt-1 text-xl">
                    K{stats.avgValue?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InboundStockPage;