import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, FileText, RefreshCw, Search, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

function RenewalPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [card, setCard] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [selectedReceiptId, setSelectedReceiptId] = useState("");
  const [loading, setLoading] = useState(false);
  const [renewals, setRenewals] = useState([]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptURL, setReceiptURL] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    const fetchCardAndRenewals = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Fetch card details
        const cardResponse = await axios.get(`http://localhost:8080/cards/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCard(cardResponse.data);
        
        // Fetch renewal history
        const renewalsResponse = await axios.get(`http://localhost:8080/cards/${id}/renewals`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRenewals(renewalsResponse.data);

        // Fetch receipts
        const receiptsResponse = await axios.get('http://localhost:8080/receipts', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setReceipts(receiptsResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load card details');
      }
    };
    
    fetchCardAndRenewals();
  }, [id]);

  const handleSearchReceipts = async (e) => {
    const search = e.target.value;
    setSearchLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8080/receipts?search=${search}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReceipts(response.data);
    } catch (error) {
      console.error('Error searching receipts:', error);
      toast.error('Failed to search receipts');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedReceiptId) {
      toast.error('Please select a receipt');
      return;
    }
    
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `http://localhost:8080/cards/${id}/renew`,
        { receipt_id: selectedReceiptId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Membership renewed successfully!');
      
      // Update local state
      setCard(prev => ({
        ...prev,
        receipt_id: selectedReceiptId,
        expires_at: response.data.card.expires_at
      }));
      
      // Refresh renewal history
      const renewalsResponse = await axios.get(
        `http://localhost:8080/cards/${id}/renewals`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRenewals(renewalsResponse.data);
      
    } catch (error) {
      console.error('Error renewing membership:', error);
      toast.error('Failed to renew membership');
    } finally {
      setLoading(false);
    }
  };

  const handleViewReceipt = async (receiptId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8080/receipts/${receiptId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      
      const fileURL = URL.createObjectURL(response.data);
      setReceiptURL(fileURL);
      setShowReceipt(true);
    } catch (error) {
      console.error('Error fetching receipt:', error);
      toast.error('Failed to fetch receipt');
    }
  };

  if (!card) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header with Back Button */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-blue-600 hover:text-blue-800 transition"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-medium">Back</span>
          </button>
        </div>

        {/* Card Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-1">
                Renew Membership for {card.firstname} {card.lastname}
              </h1>
              <p className="text-gray-600">{card.field_of_study}</p>
            </div>
            {card.expires_at && (
              <div className="mt-3 sm:mt-0">
                <p className="text-sm text-gray-500">Current Expiration</p>
                <p className="font-medium text-gray-800">
                  {new Date(card.expires_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Renewal Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Select Renewal Receipt</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Receipt Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search receipts..."
                onChange={handleSearchReceipts}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              {searchLoading && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                </div>
              )}
            </div>

            {/* Receipt Selection */}
            <div>
              <label htmlFor="receipt-select" className="block text-sm font-medium text-gray-700 mb-1">
                Select Receipt
              </label>
              <select
                id="receipt-select"
                value={selectedReceiptId}
                onChange={(e) => setSelectedReceiptId(e.target.value)}
                required
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
              >
                <option value="">Select a receipt</option>
                {receipts.map((receipt) => (
                  <option key={receipt.id} value={receipt.id}>
                    {receipt.filename}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  loading ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                    Processing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="-ml-1 mr-2 h-5 w-5" />
                    Submit Renewal
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Renewal History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Renewal History</h2>
          </div>
          
          {renewals.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">No renewal history found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Processed By
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Receipt
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {renewals.map((renewal) => (
                    <tr key={renewal.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(renewal.renewed_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {renewal.firstname} {renewal.lastname}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => handleViewReceipt(renewal.receipt_id)}
                          className="text-blue-600 hover:text-blue-800 hover:underline flex items-center"
                        >
                          <FileText className="mr-1 h-4 w-4" />
                          {renewal.filename}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Receipt Viewer Modal */}
        {showReceipt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Receipt Preview</h3>
                <button
                  onClick={() => setShowReceipt(false)}
                  className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 p-4 overflow-auto">
                <iframe
                  src={receiptURL}
                  width="100%"
                  height="100%"
                  className="border rounded-lg shadow min-h-[500px]"
                  title="Receipt Viewer"
                ></iframe>
              </div>
              <div className="p-4 border-t flex justify-end">
                <button
                  onClick={() => setShowReceipt(false)}
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RenewalPage;