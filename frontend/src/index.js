import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Import your main App component

// Get the root element from index.html
const rootElement = document.getElementById('root');

// Create a React root and render the App component into it
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// import reportWebVitals from './reportWebVitals';
// reportWebVitals();
