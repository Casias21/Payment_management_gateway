import React, { useState, useEffect } from 'react';

// Main App component for the frontend
const App = () => {
  // State for authentication
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Initially not logged in
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [userRole, setUserRole] = useState(''); // State for user role (admin, customer)
  const [loginMessage, setLoginMessage] = useState('');
  const [isRegistering, setIsRegistering] = useState(false); // To toggle between login/register views
  const [registeredUsers, setRegisteredUsers] = useState(() => {
    // Initialize registered users from localStorage or with hardcoded defaults
    try {
      const storedUsers = localStorage.getItem('registeredUsers');
      return storedUsers ? JSON.parse(storedUsers) : [
        { username: 'admin', password: 'password', role: 'admin' },
        { username: 'customer1', password: 'password', role: 'customer' },
        { username: 'customer2', password: 'password', role: 'customer' },
      ];
    } catch (e) {
      console.error("Failed to load registered users from localStorage:", e);
      return [ // Fallback to defaults
        { username: 'admin', password: 'password', role: 'admin' },
        { username: 'customer1', password: 'password', role: 'customer' },
        { username: 'customer2', password: 'password', role: 'customer' },
      ];
    }
  });

  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerMessage, setRegisterMessage] = useState('');

  // State for new payment order form
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [description, setDescription] = useState('');
  const [paymentCreationMessage, setPaymentCreationMessage] = useState('');
  const [receipt, setReceipt] = useState(null); // State for payment receipt

  // State for querying payment status
  const [paymentIdToQuery, setPaymentIdToQuery] = useState('');
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentQueryMessage, setPaymentQueryMessage] = useState('');

  // State for the payment dashboard
  const [allPayments, setAllPayments] = useState([]);
  const [dashboardMessage, setDashboardMessage] = useState('');

  // Backend API base URL - ensure this matches your docker-compose setup
  const API_BASE_URL = 'http://localhost:8080/api/payments';

  // Persist registered users to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
    } catch (e) {
      console.error("Failed to save registered users to localStorage:", e);
    }
  }, [registeredUsers]);

  // Function to handle customer registration
  const handleRegister = async () => {
    setRegisterMessage('Registering...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

    if (!registerUsername || !registerPassword) {
      setRegisterMessage('Username and password are required.');
      return;
    }
    if (registeredUsers.some(u => u.username === registerUsername)) {
      setRegisterMessage('Username already exists.');
      return;
    }

    const newUser = { username: registerUsername, password: registerPassword, role: 'customer' };
    setRegisteredUsers([...registeredUsers, newUser]);
    setRegisterMessage('Registration successful! Please log in.');
    setRegisterUsername('');
    setRegisterPassword('');
    setIsRegistering(false); // Go back to login form after successful registration
  };

  // Function to handle simulated login
  const handleLogin = async () => {
    setLoginMessage('Logging in...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

    const userFound = registeredUsers.find(
      (u) => u.username === username && u.password === password
    );

    if (userFound) {
      setIsLoggedIn(true);
      setUserRole(userFound.role);
      setLoginMessage(`Login successful as ${userFound.role}!`);
      fetchAllPayments(); // Fetch initial dashboard data after login
    } else {
      setLoginMessage('Invalid username or password.');
    }
  };

  // Function to handle logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
    setUserRole(''); // Clear user role on logout
    setLoginMessage('');
    setAllPayments([]); // Clear dashboard data on logout
    setPaymentCreationMessage('');
    setPaymentQueryMessage('');
    setPaymentStatus(null);
    setPaymentIdToQuery('');
    setReceipt(null); // Clear receipt on logout
  };

  // Function to create a new payment order
  const createPayment = async () => {
    setPaymentCreationMessage('Processing...');
    setReceipt(null); // Clear previous receipt
    try {
      const response = await fetch(`${API_BASE_URL}/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: parseFloat(amount), currency, description }),
      });

      const data = await response.json();

      if (response.ok) {
        setPaymentCreationMessage(`Payment Order Created! ID: ${data.id}. Status: ${data.status}`);
        setReceipt(data); // Store payment data for receipt
        // Optionally clear form fields
        setAmount('');
        setDescription('');
        // Refresh dashboard after new payment is created
        fetchAllPayments();
      } else {
        setPaymentCreationMessage(`Error creating payment: ${data.message || response.statusText}`);
      }
    } catch (error) {
      setPaymentCreationMessage(`Network error: ${error.message}`);
    }
  };

  // Function to query payment status
  const getPaymentStatus = async () => {
    if (!paymentIdToQuery) {
      setPaymentQueryMessage('Please enter a Payment ID.');
      setPaymentStatus(null);
      return;
    }
    setPaymentQueryMessage('Fetching status...');
    try {
      const response = await fetch(`${API_BASE_URL}/${paymentIdToQuery}/status`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setPaymentStatus(data);
        setPaymentQueryMessage(`Status for ID ${paymentIdToQuery}: ${data.status}`);
      } else {
        setPaymentStatus(null);
        setPaymentQueryMessage(`Error fetching status: ${data.message || response.statusText}`);
      }
    } catch (error) {
      setPaymentQueryMessage(`Network error: ${error.message}`);
      setPaymentStatus(null);
    }
  };

  // Function to fetch all payments for the dashboard
  const fetchAllPayments = async () => {
    setDashboardMessage('Loading payments...');
    try {
      const response = await fetch(`${API_BASE_URL}`, { // Assuming GET /api/payments fetches all
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        // Sort payments by createdAt in descending order
        const sortedPayments = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setAllPayments(sortedPayments);
        setDashboardMessage('');
      } else {
        setDashboardMessage(`Error loading payments: ${data.message || response.statusText}`);
        setAllPayments([]);
      }
    } catch (error) {
      setDashboardMessage(`Network error loading payments: ${error.message}`);
      setAllPayments([]);
    }
  };

  // Effect to fetch all payments on component mount and every 5 seconds, ONLY IF LOGGED IN
  useEffect(() => {
    let intervalId;
    if (isLoggedIn) {
      fetchAllPayments(); // Initial fetch after login
      intervalId = setInterval(fetchAllPayments, 5000); // Poll every 5 seconds
    }
    return () => clearInterval(intervalId); // Cleanup on unmount or logout
  }, [isLoggedIn]); // Re-run effect when isLoggedIn changes

  // Helper to get status text color
  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-400';
      case 'FAILED': return 'text-red-400';
      case 'RETRYING': return 'text-yellow-400';
      case 'PENDING':
      case 'PROCESSING': return 'text-blue-400';
      case 'DUPLICATE': return 'text-gray-400';
      default: return 'text-white';
    }
  };

  // Common styles to be injected once
  const commonStyles = (
    <style>{`
      body { font-family: 'Inter', sans-serif; }
      input, select, button {
        border-radius: 0.5rem; /* rounded corners */
        padding: 0.75rem 1rem;
        margin-bottom: 1rem;
      }
      button {
        transition: transform 0.2s ease-in-out, background-color 0.2s ease-in-out;
      }
      button:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 10px rgba(0,0,0,0.2);
      }
      .message {
        margin-top: 1rem;
        padding: 0.75rem;
        border-radius: 0.5rem;
        font-weight: 600;
      }
      .success { background-color: #38a169; } /* Tailwind green-600 */
      .error { background-color: #e53e3e; }   /* Tailwind red-600 */
      .info { background-color: #3182ce; }    /* Tailwind blue-600 */
    `}</style>
  );

  // Conditional rendering for Login/Register vs. Main App
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-800 to-purple-900 text-white p-8 font-inter flex flex-col items-center justify-center">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
        {commonStyles}
        <div className="bg-gray-800 bg-opacity-70 p-8 md:p-10 rounded-xl shadow-2xl w-full max-w-md">
          <h1 className="text-4xl font-bold mb-8 text-center text-indigo-300">{isRegistering ? 'Register' : 'Login'}</h1>
          
          {isRegistering ? (
            <>
              <div className="mb-4">
                <label htmlFor="registerUsername" className="block text-gray-300 text-sm font-medium mb-2">Username</label>
                <input
                  type="text"
                  id="registerUsername"
                  className="w-full bg-gray-900 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={registerUsername}
                  onChange={(e) => setRegisterUsername(e.target.value)}
                  placeholder="Choose a username"
                />
              </div>
              <div className="mb-6">
                <label htmlFor="registerPassword" className="block text-gray-300 text-sm font-medium mb-2">Password</label>
                <input
                  type="password"
                  id="registerPassword"
                  className="w-full bg-gray-900 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  placeholder="Choose a password"
                />
              </div>
              <button
                onClick={handleRegister}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-md shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Register
              </button>
              {registerMessage && (
                <p className={`message ${registerMessage.includes('successful') ? 'success' : 'error'}`}>
                  {registerMessage}
                </p>
              )}
              <button
                onClick={() => setIsRegistering(false)}
                className="mt-4 w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-md shadow-lg"
              >
                Back to Login
              </button>
            </>
          ) : (
            <>
              <div className="mb-4">
                <label htmlFor="username" className="block text-gray-300 text-sm font-medium mb-2">Username</label>
                <input
                  type="text"
                  id="username"
                  className="w-full bg-gray-900 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                />
              </div>
              <div className="mb-6">
                <label htmlFor="password" className="block text-gray-300 text-sm font-medium mb-2">Password</label>
                <input
                  type="password"
                  id="password"
                  className="w-full bg-gray-900 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                />
              </div>
              <button
                onClick={handleLogin}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-md shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Login
              </button>
              {loginMessage && (
                <p className={`message ${loginMessage.includes('Invalid') ? 'error' : 'success'}`}>
                  {loginMessage}
                </p>
              )}
              <button
                onClick={() => setIsRegistering(true)}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-md shadow-lg"
              >
                Register a New Account
              </button>
              <p className="text-center text-gray-400 text-sm mt-4">
                Hint: Existing users "admin" or "customer1", "customer2" with password "password".
                New registrations are "customer" role by default.
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // Render main application if logged in
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-800 to-purple-900 text-white p-8 font-inter flex flex-col items-center justify-center">
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
      {commonStyles} {/* Include common styles */}

      <div className="bg-gray-800 bg-opacity-70 p-8 md:p-12 rounded-xl shadow-2xl w-full max-w-4xl transform transition-all duration-500 ease-in-out hover:scale-105">
        <h1 className="text-4xl font-bold mb-8 text-center text-indigo-300">Payment Gateway Dashboard</h1>
        
        {/* User Info and Logout Button */}
        <div className="flex justify-between items-center mb-4">
          <p className="text-lg text-gray-300">Logged in as: <span className="font-semibold capitalize text-indigo-200">{userRole}</span> (<span className="font-semibold text-indigo-200">{username}</span>)</p>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md shadow-lg"
          >
            Logout
          </button>
        </div>

        {/* Admin Actions Section (Visible only to Admin) */}
        {userRole === 'admin' && (
          <div className="mb-10 p-6 bg-yellow-700 bg-opacity-70 rounded-lg shadow-inner border border-yellow-500">
            <h2 className="text-2xl font-semibold mb-4 text-yellow-200">Admin Actions</h2>
            <p className="text-yellow-100 mb-4">
              This section is visible only to users with the 'admin' role.
              Here you could add functionalities like:
            </p>
            <ul className="list-disc list-inside text-yellow-100">
              <li>Manual transaction approval/rejection</li>
              <li>User management (e.g., viewing all registered users)</li>
              <li>System configuration updates</li>
              <li>Detailed audit logs</li>
            </ul>
            <button className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-md shadow-lg">
              Perform Admin Task (Placeholder)
            </button>
          </div>
        )}

        {/* Payment Dashboard Section */}
        <div className="mb-10 p-6 bg-gray-700 bg-opacity-70 rounded-lg shadow-inner">
          <h2 className="text-2xl font-semibold mb-6 text-white">All Payments Overview</h2>
          {dashboardMessage && (
            <p className={`message ${dashboardMessage.includes('Error') ? 'error' : 'info'}`}>
              {dashboardMessage}
            </p>
          )}
          {allPayments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-600 rounded-lg overflow-hidden">
                <thead className="bg-gray-800">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">ID</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Amount</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Description</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Created</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Last Updated</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-900 divide-y divide-gray-700">
                  {allPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-800 transition-colors duration-200">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-200 truncate max-w-xs">{payment.id}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-200">{payment.amount} {payment.currency}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-200 truncate max-w-xs">{payment.description}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold">
                        <span className={getStatusColor(payment.status)}>{payment.status}</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-200">
                        {new Date(payment.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-200">
                        {payment.lastUpdatedAt ? new Date(payment.lastUpdatedAt).toLocaleString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            !dashboardMessage && <p className="text-gray-400 text-center py-4">No payments found. Create one below!</p>
          )}
        </div>

        {/* Create Payment Section - Only visible if logged in */}
        {isLoggedIn && ( // Restrict this section to logged-in users
          <div className="mb-10 p-6 bg-gray-700 bg-opacity-70 rounded-lg shadow-inner">
            <h2 className="text-2xl font-semibold mb-6 text-white">Create New Payment Order</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="amount" className="block text-gray-300 text-sm font-medium mb-2">Amount</label>
                <input
                  type="number"
                  id="amount"
                  className="w-full bg-gray-900 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g., 100.00"
                  step="0.01"
                />
              </div>
              <div>
                <label htmlFor="currency" className="block text-gray-300 text-sm font-medium mb-2">Currency</label>
                <select
                  id="currency"
                  className="w-full bg-gray-900 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  {/* You can add more currencies here, conceptually representing different banking systems */}
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label htmlFor="description" className="block text-gray-300 text-sm font-medium mb-2">Description</label>
              <input
                type="text"
                id="description"
                className="w-full bg-gray-900 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Online purchase"
              />
            </div>
            <button
              onClick={createPayment}
              className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-md shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Pay Now
            </button>
            {paymentCreationMessage && (
              <p className={`message ${paymentCreationMessage.includes('Error') ? 'error' : 'success'}`}>
                {paymentCreationMessage}
              </p>
            )}

            {/* Payment Receipt */}
            {receipt && (
              <div className="mt-6 p-4 bg-gray-900 rounded-md text-sm border border-indigo-400">
                <h3 className="font-bold text-lg mb-2 text-indigo-400">Payment Receipt</h3>
                <p><strong>Payment ID:</strong> {receipt.id}</p>
                <p><strong>Amount:</strong> {receipt.amount} {receipt.currency}</p>
                <p><strong>Description:</strong> {receipt.description || 'N/A'}</p>
                <p><strong>Status:</strong> <span className={`font-semibold ${getStatusColor(receipt.status)}`}>{receipt.status}</span></p>
                <p><strong>Transaction Time:</strong> {new Date(receipt.createdAt).toLocaleString()}</p>
                <p className="mt-2 text-green-300">Thank you for your payment!</p>
              </div>
            )}
          </div>
        )}

        {/* Query Payment Status Section */}
        {isLoggedIn && ( // Restrict this section to logged-in users
          <div className="p-6 bg-gray-700 bg-opacity-70 rounded-lg shadow-inner">
            <h2 className="text-2xl font-semibold mb-6 text-white">Query Payment Status</h2>
            <div>
              <label htmlFor="paymentIdQuery" className="block text-gray-300 text-sm font-medium mb-2">Payment ID</label>
              <input
                type="text"
                id="paymentIdQuery"
                className="w-full bg-gray-900 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={paymentIdToQuery}
                onChange={(e) => setPaymentIdToQuery(e.target.value)}
                placeholder="Enter payment ID"
              />
            </div>
            <button
              onClick={getPaymentStatus}
              className="mt-6 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-md shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Get Status
            </button>
            {paymentQueryMessage && (
              <p className={`message ${paymentQueryMessage.includes('Error') ? 'error' : 'info'}`}>
                {paymentQueryMessage}
              </p>
            )}
            {paymentStatus && (
              <div className="mt-4 p-4 bg-gray-900 rounded-md text-sm">
                <h3 className="font-bold text-lg mb-2 text-indigo-400">Payment Details:</h3>
                <p><strong>ID:</strong> {paymentStatus.id}</p>
                <p><strong>Amount:</strong> {paymentStatus.amount} {paymentStatus.currency}</p>
                <p><strong>Description:</strong> {paymentStatus.description}</p>
                <p><strong>Status:</strong> <span className={`font-semibold ${getStatusColor(paymentStatus.status)}`}>{paymentStatus.status}</span></p>
                <p><strong>Created At:</strong> {new Date(paymentStatus.createdAt).toLocaleString()}</p>
                {paymentStatus.lastUpdatedAt && (
                  <p><strong>Last Updated At:</strong> {new Date(paymentStatus.lastUpdatedAt).toLocaleString()}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
