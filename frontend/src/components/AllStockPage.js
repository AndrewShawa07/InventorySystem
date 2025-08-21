import React, { useEffect, useState, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend as ChartLegend } from "chart.js";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaSearch, FaArrowLeft, FaBox, FaBoxOpen, FaExchangeAlt, FaMinus, FaWarehouse, FaDollarSign } from "react-icons/fa";
import { FiTrendingUp, FiTrendingDown } from "react-icons/fi";
import { useContext } from 'react';
import { SidebarContext } from '../context/SidebarContext';
import { Menu } from '@headlessui/react'
import { FaChevronDown } from 'react-icons/fa'

ChartJS.register(ArcElement, ChartTooltip, ChartLegend);

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF'];

const StockTransactionsPage = () => {
  const { isSidebarOpen, isCollapsed } = useContext(SidebarContext);
  const [last7DaysData, setLast7DaysData] = useState([]);
  const [transactionTypeData, setTransactionTypeData] = useState({
    labels: ["Inbound", "Outbound", "Adjustments"],
    datasets: [
      {
        data: [0, 0, 0],
        backgroundColor: ["#10B981", "#F59E0B", "#3B82F6"],
        hoverBackgroundColor: ["#059669", "#D97706", "#2563EB"],
      },
    ],
  });
  const [allTransactions, setAllTransactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("date-newest");
  const [filter, setFilter] = useState("all");
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalInbound: 0,
    totalOutbound: 0,
    inventoryValue: 0,
    trendingProducts: []
  });
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
      
      // Fetch all transactions
      const transactionsResponse = await axios.get("http://localhost:8080/stock-transactions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllTransactions(transactionsResponse.data);
      
      // Fetch stats
      const statsResponse = await axios.get("http://localhost:8080/stock-transactions/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Process the stats data
      const processedStats = {
        ...statsResponse.data,
        inventoryValue: parseFloat(statsResponse.data.inventoryValue) || 0,
        totalInbound: parseInt(statsResponse.data.totalInbound) || 0,
        totalOutbound: parseInt(statsResponse.data.totalOutbound) || 0,
        totalTransactions: parseInt(statsResponse.data.totalTransactions) || 0,
        trendingProducts: statsResponse.data.trendingProducts.map(product => ({
          ...product,
          changePercentage: parseFloat(product.changePercentage) || 0
        }))
      };

      setStats(processedStats);
console.log("Processed Stats:", processedStats);
      // Update transaction type data
      const typeCounts = {
        inbound: processedStats.totalInbound,
        outbound: processedStats.totalOutbound,
        adjustments: processedStats.totalTransactions - (processedStats.totalInbound + processedStats.totalOutbound)
      };

      setTransactionTypeData({
        labels: ["Inbound", "Outbound", "Adjustments"],
        datasets: [
          {
            data: [typeCounts.inbound, typeCounts.outbound, typeCounts.adjustments],
            backgroundColor: ["#10B981", "#DC2626", "#3B82F6"],
            hoverBackgroundColor: ["#059669", "#D97706", "#2563EB"],
          },
        ],
      });
      
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
      setAllTransactions(prev => prev.filter(t => t.id !== id));
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
    return [...allTransactions].sort((a, b) => {
      const dateA = new Date(a.date || 0);
      const dateB = new Date(b.date || 0);
      
      switch (sortOrder) {
        case "product-asc":
          return (a.product_name || '').localeCompare(b.product_name || '');
        case "product-desc":
          return (b.product_name || '').localeCompare(a.product_name || '');
        case "date-newest":
          return dateB - dateA;
        case "date-oldest":
          return dateA - dateB;
        default:
          return 0;
      }
    });
  }, [allTransactions, sortOrder]);

  const filteredTransactions = React.useMemo(() => {
    return sortedTransactions.filter((transaction) => {
      const productName = transaction.product_name || '';
      const transactionType = transaction.transaction_type || '';
      const quantity = transaction.quantity || 0;
      const unitPrice = transaction.unit_price || 0;
      const value = transaction.unit_price ? (transaction.quantity * transaction.unit_price).toFixed(2) : '0.00';
    
      const transactionDate = transaction.date 
        ? new Date(transaction.date).toLocaleDateString("en-GB") 
        : '';

      const matchesSearch =
        productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transactionType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        quantity.toString().includes(searchQuery) ||
        unitPrice.toString().includes(searchQuery) ||
        value.includes(searchQuery) ||
        transactionDate.includes(searchQuery);

      if (filter === "all") return matchesSearch;
      if (filter === "inbound") return matchesSearch && transactionType === "inbound";
      if (filter === "outbound") return matchesSearch && transactionType === "outbound";
      if (filter === "adjustment") return matchesSearch && transactionType === "adjustment";
      return matchesSearch;
    });
  }, [sortedTransactions, searchQuery, filter]);

  useEffect(() => {
    if (isAuthenticated()) {
      fetchData();
    }
  }, [isAuthenticated, fetchData]);

  // Prepare data for trending products chart
  const trendingProductsData = stats.trendingProducts.map(product => ({
    name: product.name,
    value: Math.abs(product.changePercentage),
    originalValue: product.changePercentage,
    transactionCount: product.transactionCount
  }));
  trendingProductsData.sort((a, b) => b.originalValue - a.originalValue); //sorts the oder from top rising to bottom falling

  return (
    <div className={`min-h-screen bg-gray-50 pt-16 pb-8 px-4 sm:px-6 lg:px-8 transition-all duration-300 ${
      isSidebarOpen ? (isCollapsed ? 'ml-16' : 'ml-64') : 'ml-0'
    }`}>
      {/* Delete Confirmation Popup */}
      {showDeletePopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center w-96">
            <h2 className="text-xl font-semibold mb-4">Confirm Deletion</h2>
            <p className="text-gray-700 mb-6">Are you sure you want to delete this transaction?</p>
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
          <h1 className="text-2xl font-bold text-gray-800">Stock Transactions</h1>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column - Table (70% width) */}
          <div className="lg:w-[70%]">
            {/* Filters and Search */}
            <div className="bg-white p-4 rounded-lg shadow-lg mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Filter Dropdown */}
                <div className="relative flex-1 sm:flex-none sm:w-48">
                  <label htmlFor="filter-dropdown" className="sr-only">Filter</label>
                  <select
                    id="filter-dropdown"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="all">All Transactions</option>
                    <option value="inbound">Inbound</option>
                    <option value="outbound">Outbound</option>
                    <option value="adjustment">Adjustments</option>
                  </select>
                </div>

                {/* Search Input */}
                <div className="relative flex-1 min-w-0">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search transactions..."
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
                    <option value="date-newest">Date: Newest</option>
                    <option value="date-oldest">Date: Oldest</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <Menu as="div" className="relative inline-block text-left mb-6">
  <Menu.Button className="inline-flex justify-center w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none shadow-sm hover:shadow-md">
    <span className="mr-2">New Stock Action</span>
    <FaChevronDown className="w-5 h-5" />
  </Menu.Button>

  <Menu.Items className="absolute left-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
    <div className="py-1">
      <Menu.Item>
        {({ active }) => (
          <Link
            to="/add-inbound-transaction"
            className={`${
              active ? 'bg-green-100' : ''
            } flex items-center px-4 py-2 text-sm text-gray-700`}
          >
            <FaBox className="w-5 h-5 mr-2 text-green-600" />
            Add New Inbound Stock
          </Link>
        )}
      </Menu.Item>
      <Menu.Item>
        {({ active }) => (
          <Link
            to="/add-outbound-transaction"
            className={`${
              active ? 'bg-red-100' : ''
            } flex items-center px-4 py-2 text-sm text-gray-700`}
          >
            <FaBoxOpen className="w-5 h-5 mr-2 text-red-600" />
            Issue Outbound Stock
          </Link>
        )}
      </Menu.Item>
      <Menu.Item>
        {({ active }) => (
          <Link
            to="/add-adjustment-transaction"
            className={`${
              active ? 'bg-blue-100' : ''
            } flex items-center px-4 py-2 text-sm text-gray-700`}
          >
            <FaExchangeAlt className="w-5 h-5 mr-2 text-blue-600" />
            Create Adjustment
          </Link>
        )}
      </Menu.Item>
    </div>
  </Menu.Items>
</Menu>

            {/* Transactions Table */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Stock Transactions</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-600 text-sm">
                      <th className="pb-2 font-medium">Product</th>
                      <th className="pb-2 font-medium">Type</th>
                      <th className="pb-2 font-medium">Quantity</th>
                      <th className="pb-2 font-medium">Unit Price</th>
                      <th className="pb-2 font-medium">Total Value</th>
                      <th className="pb-2 font-medium">Date</th>
                      {/* {role === "admin" && <th className="pb-2 font-medium">Actions</th>} */}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.length > 0 ? (
                      filteredTransactions.map((transaction) => (
                        <tr 
                          key={transaction.id} 
                          className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleView(transaction.id)}
                        >
                          <td className="py-3">{transaction.product_name || 'N/A'}</td>
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
                          <td className="py-3">K{Number(transaction.unit_price || 0).toFixed(2)}</td>
                          <td className="py-3">
                            K{transaction.unit_price ? (transaction.quantity * transaction.unit_price).toFixed(2) : '0.00'}
                          </td>
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
                      ))
                    ) : (
                      <tr>
                        <td colSpan={role === "admin" ? 6 : 5} className="py-4 text-center text-gray-500">
                          No transactions found matching your criteria
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
             {/* Recent Activity */}
             <motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, delay: 0.2 }}
  className="bg-white p-4 rounded-lg shadow-sm"
>
<div className="flex items-center justify-between mb-4">
  <h2 className="text-lg font-semibold">Recent Activity</h2>
  <h2 className="text-lg font-semibold text-right">Stock Distribution</h2>
</div>


  <div className="flex flex-col lg:flex-row">
    {/* Left: Recent Activity */}
    <div className="lg:w-1/2 pr-0 lg:pr-4 border-b lg:border-b-0 lg:border-r border-gray-200">
      <div className="space-y-3">
        {allTransactions.slice(0, 4).map((transaction) => (
          <div key={transaction.id} className="flex items-start">
            <div
              className={`p-2 rounded-full mr-3 ${
                transaction.transaction_type === 'inbound'
                  ? 'bg-green-100 text-green-600'
                  : transaction.transaction_type === 'outbound'
                  ? 'bg-red-100 text-red-600'
                  : 'bg-blue-100 text-blue-600'
              }`}
            >
              {transaction.transaction_type === 'inbound' ? (
                <FiTrendingUp className="w-4 h-4" />
              ) : transaction.transaction_type === 'outbound' ? (
                <FiTrendingDown className="w-4 h-4" />
              ) : (
                <FaExchangeAlt className="w-4 h-4" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{transaction.product_name}</p>
              <p className="text-xs text-gray-500">
                {transaction.transaction_type} • {transaction.quantity} units •{' '}
                {new Date(transaction.date).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Right: Doughnut Chart */}
    <div className="lg:w-1/2 mt-6 lg:mt-0 pl-0 lg:pl-4 flex items-center justify-center">
      <div className="w-full max-w-xs h-48">
        <Doughnut
          data={transactionTypeData}
          options={{
            plugins: {
              legend: {
                position: 'bottom',
              },
              tooltip: {
                callbacks: {
                  label: function (context) {
                    const label = context.label || '';
                    const value = context.raw || 0;
                    const total = context.dataset.data.reduce((acc, data) => acc + data, 0);
                    const percentage = Math.round((value / total) * 100);
                    return `${label}: ${value} (${percentage}%)`;
                  },
                },
              },
            },
            maintainAspectRatio: false,
          }}
        />
      </div>
    </div>
  </div>
</motion.div>
          <motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, delay: 0.2 }}
  className="bg-indigo-950 p-5 rounded-lg shadow-md text-white"
>
  <h2 className="text-lg font-semibold mb-4">📊 Trending Products</h2>

  {stats.trendingProducts && stats.trendingProducts.length > 0 ? (
    <div className="space-y-4">
      {/* Chart */}
      {/* <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={trendingProductsData}
              cx="50%"
              cy="50%"
              outerRadius={40}
              dataKey="value"
              nameKey="name"
              labelLine={false}
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
            >
              {trendingProductsData.map((entry, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: "#1f2937", border: "none" }}
              itemStyle={{ color: "#fff" }}
              formatter={(value, name, props) => [
                `${props.payload.originalValue}% change`,
                `Transactions: ${props.payload.transactionCount}`,
              ]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div> */}

      {/* Arrows List */}
      <div className="divide-y divide-gray-700 text-sm">
        {trendingProductsData.map((item, index) => {
          const change = item.originalValue;
          const isPositive = change > 0;
          const isNegative = change < 0;

          return (
            <div
              key={index}
              className="flex justify-between py-2 items-center"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-white">{item.name}</span>
              </div>
              <div
                className={`flex items-center gap-1 text-sm font-medium ${
                  isPositive
                    ? "text-green-400"
                    : isNegative
                    ? "text-red-400"
                    : "text-gray-400"
                }`}
              >
                {isPositive && <FiTrendingUp />}
                {isNegative && <FiTrendingDown />}
                {!isPositive && !isNegative && <FaMinus />}
                {Math.abs(change).toFixed(1)}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  ) : (
    <div className="h-64 flex items-center justify-center text-gray-400">
      No trending products data available
    </div>
  )}
</motion.div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default StockTransactionsPage;
//working version
