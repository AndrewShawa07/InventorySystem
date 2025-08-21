import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Edit, Trash2, FileText, Box, Clock, Inbox, Settings } from "lucide-react";
import { FaArrowLeft } from "react-icons/fa";
import { useContext } from 'react';
import { SidebarContext } from '../context/SidebarContext';

function ViewStockTransaction() {
  const { isSidebarOpen, isCollapsed } = useContext(SidebarContext);
  const { id } = useParams();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDocument, setShowDocument] = useState(false);
  const [documentURL, setDocumentURL] = useState(null);
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`http://localhost:8080/stock-transactions/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setTransaction(response.data);
        console.log("Transaction data indi:", response.data);
      } catch (error) {
        console.error("Error fetching transaction:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [id]);

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:8080/stock-transactions/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      navigate(-1); // Navigate back to the previous page after deletion
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  const handleViewDocument = async (documentId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`http://localhost:8080/documents/${documentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob",
      });
      const fileURL = URL.createObjectURL(response.data);
      setDocumentURL(fileURL);
      setShowDocument(true);
    } catch (error) {
      console.error("Error fetching document:", error);
      alert("Failed to fetch document. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="bg-white p-6 rounded-lg shadow-md text-center max-w-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Transaction Not Found</h2>
          <p className="text-gray-600 mb-4">The requested transaction could not be found.</p>
                <div className="flex items-center mb-6">
                  <button 
                    onClick={() => navigate(-1)} 
                    className="mr-4 p-2 rounded-full hover:bg-gray-200"
                  >
                    <FaArrowLeft className="text-gray-600" />
                  </button>
                  <h1 className="text-2xl font-bold text-gray-800">Transaction Details</h1>
                </div>
        </div>
      </div>
    );
  }

  const getTransactionIcon = () => {
    switch (transaction.transaction_type) {
      case 'inbound':
        return <Inbox className="w-6 h-6 text-green-600" />;
      // case 'outbound':
        // return <Outbox className="w-6 h-6 text-red-600" />;
      case 'adjustment':
        return <Settings className="w-6 h-6 text-blue-600" />;
      default:
        return <Box className="w-6 h-6 text-gray-600" />;
    }
  };

  const getTransactionColor = () => {
    switch (transaction.transaction_type) {
      case 'inbound':
        return 'bg-green-100 text-green-800';
      case 'outbound':
        return 'bg-red-100 text-red-800';
      case 'adjustment':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
                  <h1 className="text-2xl font-bold text-gray-800">Transaction Details</h1>
                </div>

        {/* Transaction Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center">
              {getTransactionIcon()}
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-800 mb-1">
                  {transaction.product_name || 'Product'}
                </h1>
                <p className="text-gray-600">Transaction #{transaction.id}</p>
              </div>
            </div>
            <div className="mt-3 sm:mt-0">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTransactionColor()}`}>
                {transaction.transaction_type}
              </span>
            </div>
          </div>
        </div>

        {/* Transaction Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">
              Product Information
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Product Name</p>
                <p className="mt-1 text-gray-800">{transaction.product_name || "Not provided"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Quantity</p>
                <p className="mt-1 text-gray-800">{transaction.quantity}</p>
              </div>
              {transaction.unit_price && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Unit Price</p>
                  <p className="mt-1 text-gray-800">
                    K{parseFloat(transaction.unit_price).toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">
              Transaction Metadata
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Transaction Date</p>
                <p className="mt-1 text-gray-800">
                  {new Date(transaction.date).toLocaleDateString("en-GB", {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Transaction Type</p>
                <p className="mt-1 text-gray-800 capitalize">{transaction.transaction_type}</p>
              </div>
              {transaction.remarks && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Remarks</p>
                  <p className="mt-1 text-gray-800">{transaction.remarks}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Additional Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-purple-500" />
            Additional Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* Left column with 2 items stacked */}
  <div className="space-y-4">
    {transaction.transaction_type === 'inbound' && (
      <div>
        <p className="text-sm font-medium text-gray-500">Supplier</p>
        <p className="mt-1 text-gray-800">{transaction.supplier_name}</p>
      </div>
    )}
    {transaction.transaction_type === 'outbound' && (
      <div>
        <p className="text-sm font-medium text-gray-500">Collected By</p>
        <p className="mt-1 text-gray-800">{transaction.collected_by}</p>
      </div>
    )}
        {transaction.transaction_type === 'outbound' && (
      <div>
        <p className="text-sm font-medium text-gray-500">Department</p>
        <p className="mt-1 text-gray-800">{transaction.department_name}</p>
      </div>
    )}
    {(transaction.transaction_type === 'adjustment' || transaction.transaction_type === 'inbound') && (
       <div>
       <p className="text-sm font-medium text-gray-500">Performed By</p>
       <p className="mt-1 text-gray-800">{transaction.performed_by_name}</p>
     </div>
    )}
  </div>

  {/* Right column with remaining items stacked */}
  <div className="space-y-4">
    {/* {transaction.transaction_type === 'outbound' && (
      <div>
        <p className="text-sm font-medium text-gray-500">Department</p>
        <p className="mt-1 text-gray-800">{transaction.department_name}</p>
      </div>
    )} */}
    {transaction.transaction_type === 'outbound' && (
    <div>
      <p className="text-sm font-medium text-gray-500">Performed By</p>
      <p className="mt-1 text-gray-800">{transaction.performed_by_name}</p>
    </div>
    )}
  </div>
</div>

        </div>

        {/* Document Section */}
        {transaction.document_id && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-2">Supporting Documents</h2>
                <p className="text-sm text-gray-500">View attached documents for this transaction</p>
              </div>
              <div className="mt-4 sm:mt-0">
                <button
                  onClick={() => handleViewDocument(transaction.document_id)}
                  className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  View Document
                </button>
              </div>
            </div>
          </div>
        )}

        {role === "admin" && (
          <div className="flex item justify-end space-x-2">
            <button
              onClick={() => navigate(`/edit-stock-transaction/${id}`)}
              className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
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

        {/* Document Viewer Modal */}
        {showDocument && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Document Preview</h3>
                <button
                  onClick={() => setShowDocument(false)}
                  className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 p-4 overflow-auto">
                <iframe
                  src={documentURL}
                  width="100%"
                  height="100%"
                  className="border rounded-lg shadow min-h-[500px]"
                  title="Document Viewer"
                ></iframe>
              </div>
              <div className="p-4 border-t flex justify-end">
                <button
                  onClick={() => setShowDocument(false)}
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Confirm Deletion</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this transaction? This action cannot be undone.
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
                  Delete Transaction
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ViewStockTransaction;