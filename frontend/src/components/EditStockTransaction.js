import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Save, Trash2, Inbox, outbox, Settings } from "lucide-react";
import { FaArrowLeft } from "react-icons/fa";
import { useContext } from 'react';
import { SidebarContext } from '../context/SidebarContext';

function EditStockTransaction() {
  const { isSidebarOpen, isCollapsed } = useContext(SidebarContext);
  const { id } = useParams();
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  const [formData, setFormData] = useState({
    product_id: "",
    transaction_type: "",
    quantity: "",
    date: "",
    remarks: "",
    supplier_id: null,
    collected_by: "",
    department_id: null,
    performed_by: ""
  });

  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        
        // Fetch all required data in parallel
        const [transactionRes, productsRes, suppliersRes, departmentsRes, usersRes] = await Promise.all([
          axios.get(`http://localhost:8080/stock-transactions/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`http://localhost:8080/products`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`http://localhost:8080/suppliers`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`http://localhost:8080/departments`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`http://localhost:8080/users`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        const transaction = transactionRes.data;
        
        setFormData({
          product_id: transaction.product_id,
          transaction_type: transaction.transaction_type,
          quantity: transaction.quantity,
          date: transaction.date.split('T')[0], // Format date for input
          remarks: transaction.remarks || "",
          supplier_id: transaction.supplier_id || null,
          collected_by: transaction.collected_by || "",
          department_id: transaction.department_id || null,
          performed_by: transaction.performed_by || ""
        });
        const productsData = productsRes.data.products || [];
        // Ensure productsData is an array before setting state
        if (Array.isArray(productsData)) {
            console.log("Products data:", productsData); // Debug log
            setProducts(productsData);
          } else {
            console.warn("Products response is not an array:", productsData);
            setProducts([]); // Fallback to empty array
          }
        setSuppliers(suppliersRes.data);
        setDepartments(departmentsRes.data);
        setUsers(usersRes.data);

      } catch (error) {
        console.error("Error fetching data:", error);
        if (error.response?.status === 401) {
          navigate("/login");
        } else {
          setErrors({ fetch: "Failed to load transaction data. Please try again." });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const token = localStorage.getItem("token");
      const payload = {
        product_id: formData.product_id,
        transaction_type: formData.transaction_type,
        quantity: formData.quantity,
        date: formData.date,
        remarks: formData.remarks,
        supplier_id: formData.transaction_type === 'inbound' ? formData.supplier_id : null,
        collected_by: formData.transaction_type === 'outbound' ? formData.collected_by : null,
        department_id: formData.transaction_type === 'outbound' ? formData.department_id : null,
        performed_by: formData.performed_by
      };

      await axios.patch(`http://localhost:8080/stock-transactions/${id}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      navigate(`/view-stock-transaction/${id}`, { 
        state: { success: "Transaction updated successfully!" } 
      });

    } catch (error) {
      console.error("Error updating transaction:", error);
      if (error.response?.status === 401) {
        navigate("/login");
      } else {
        setErrors({ 
          submit: error.response?.data?.message || "Failed to update transaction. Please try again." 
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTransactionIcon = () => {
    switch (formData.transaction_type) {
      case 'inbound':
        return <Inbox className="w-6 h-6 text-green-600" />;
      case 'outbound':
        return <Inbox className="w-6 h-6 text-red-600" />;
      case 'adjustment':
        return <Settings className="w-6 h-6 text-blue-600" />;
      default:
        return <Inbox className="w-6 h-6 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-gray-800">Edit Transaction</h1>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 md:p-8">
            {errors.fetch && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
                {errors.fetch}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Transaction Type */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transaction Type
                  </label>
                  <div className="flex items-center space-x-4">
                    {getTransactionIcon()}
                    <select
                      name="transaction_type"
                      value={formData.transaction_type}
                      onChange={handleChange}
                      required
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    >
                      <option value="" disabled>Select Transaction Type</option>
                      <option value="inbound">Inbound</option>
                      <option value="outbound">Outbound</option>
                      <option value="adjustment">Adjustment</option>
                    </select>
                  </div>
                </div>

                {/* Product */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                  <select
                    name="product_id"
                    value={formData.product_id}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                  >
                    <option value="" disabled>Select Product</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity {formData.transaction_type === 'adjustment' && '(Use negative for reductions)'}
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    min={formData.transaction_type === 'adjustment' ? undefined : 0}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                  />
                </div>

                {/* Performed By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Performed By</label>
                  <select
                    name="performed_by"
                    value={formData.performed_by}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                  >
                    <option value="" disabled>Select User</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {`${user.firstname} ${user.lastname}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Remarks */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                  />
                </div>

                {/* Conditional Fields */}
                {formData.transaction_type === 'inbound' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                      <select
                        name="supplier_id"
                        value={formData.supplier_id || ""}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                      >
                        <option value="" disabled>Select Supplier</option>
                        {suppliers.map(supplier => (
                          <option key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div></div> {/* Empty div for layout */}
                  </>
                )}

                {formData.transaction_type === 'outbound' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Collected By</label>
                      <input
                        type="text"
                        name="collected_by"
                        value={formData.collected_by}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                        placeholder="Name of person who collected"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                      <select
                        name="department_id"
                        value={formData.department_id || ""}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                      >
                        <option value="" disabled>Select Department</option>
                        {departments.map(dept => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3 px-6 rounded-lg font-medium transition flex items-center justify-center ${
                    isSubmitting 
                      ? "bg-gray-400 cursor-not-allowed" 
                      : "bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Update Transaction
                    </>
                  )}
                </button>
                {errors.submit && (
                  <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm">
                    {errors.submit}
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditStockTransaction;