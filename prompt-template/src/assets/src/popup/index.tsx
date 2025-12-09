import React from 'react';
import ReactDOM from 'react-dom/client';

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <div>Popup Component</div>
    </React.StrictMode>
  );
}