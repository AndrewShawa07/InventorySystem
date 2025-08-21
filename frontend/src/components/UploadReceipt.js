import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {Link, useNavigate } from "react-router-dom";
import "../index.css";

function UploadReceipt() {
  const [receiptFile, setReceiptFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Check if the user is authenticated
  const isAuthenticated = () => {
    const token = localStorage.getItem("token");
    return !!token;
  };

  // Handle file change
  const handleFileChange = (e) => {
    setReceiptFile(e.target.files[0]);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated()) {
      toast.error("You must be logged in to upload a receipt.");
      navigate("/login");
      return;
    }

    if (!receiptFile) {
      toast.error("Please select a file to upload.");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("receipt", receiptFile);

      const response = await axios.post(
        "http://localhost:8080/upload-receipt",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Upload response:", response.data);
       // Show success toast before reload
       toast.success("Receipt uploaded successfully!", {
        autoClose: 2000, // 2000ms = 2 seconds
      });
    // Reload the page after a short delay (after toast notification is shown)
    setTimeout(() => {
      window.location.reload();
    }, 2000);
    //   navigate("/create-card"); // Redirect to the create card page after upload
    } catch (error) {
      console.error("Error uploading receipt:", error);
      toast.error("Failed to upload receipt. Please try again.");
      if (error.response && error.response.status === 401) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
      <Link to="/record-manager" className="text-blue-500 hover:underline mb-4 block">
          &larr; Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-green-700 mb-8 text-center">
          Upload Receipt
        </h1>
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-green-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* File Input */}
            <div>
              <input
                type="file"
                onChange={handleFileChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 px-4 rounded-md transition ${
                loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 text-white"
              }`}
            >
              {loading ? "Uploading..." : "Upload Receipt"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default UploadReceipt;