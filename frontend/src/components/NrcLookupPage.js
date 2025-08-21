import React, { useState } from 'react';
import axios from 'axios';
import { Link,useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

function NrcLookupPage() {
  const [nrc, setNrc] = useState('');
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const checkNrcExists = async () => {
    if (!nrc) {
      setErrors({ nrc: 'Please enter NRC number' });
      return false;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:8080/check-nrc-exists',
        { nrc },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.data.exists) {
        setErrors({ nrc: 'Member with this NRC not found' });
        return false;
      }

      // If exists, set the card details and clear errors
      setCard(response.data.card);
      setErrors({});
      return true;
    } catch (error) {
      console.error('Error checking NRC:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      } else {
        setErrors({ nrc: 'Error checking NRC. Please try again.' });
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isValid = await checkNrcExists();
    if (isValid) {
      toast.success('Member found! Proceeding to renewal...');
    }
  };

  const handleRenew = () => {
    if (card) {
      navigate(`/renew-card/${card.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
      <Link to="/record-manager" className="text-blue-500 hover:underline mb-4 block">
          &larr; Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-green-700 mb-8 text-center">
          Membership Renewal
          </h1>
        <div className="bg-white rounded-lg shadow-md p-6 border border-green-100 mb-6">
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="nrc" className="block text-sm font-medium text-gray-700 mb-1">
                Enter Member NRC Number
              </label>
              <input
                type="text"
                id="nrc"
                value={nrc}
                onChange={(e) => {
                  setNrc(e.target.value);
                  setErrors({ ...errors, nrc: '' });
                }}
                className={`w-full px-4 py-2 border ${
                  errors.nrc ? 'border-red-500' : 'border-gray-300'
                } rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
                placeholder="e.g. 123456/78/1"
              />
              {errors.nrc && (
                <p className="mt-1 text-sm text-red-600">{errors.nrc}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 px-4 rounded-md transition ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {loading ? 'Checking...' : 'Check Member'}
            </button>
          </form>
        </div>

        {card && (
          <div className="bg-white rounded-lg shadow-md p-6 border border-green-100">
            <h2 className="text-xl font-bold text-green-700 mb-4">Member Found</h2>
            <div className="space-y-2 mb-4">
              <p><span className="font-semibold">Name:</span> {card.firstname} {card.lastname}</p>
              <p><span className="font-semibold">NRC:</span> {card.nrc}</p>
              <p><span className="font-semibold">Field:</span> {card.field_of_study}</p>
              {card.expires_at && (
                <p><span className="font-semibold">Expires:</span> {new Date(card.expires_at).toLocaleDateString()}</p>
              )}
            </div>
            <button
              onClick={handleRenew}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Proceed to Renewal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default NrcLookupPage;