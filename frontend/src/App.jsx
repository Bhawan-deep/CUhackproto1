import React, { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import BountyWorkspace from './pages/BountyWorkspace';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
    }
  };

  if (currentPath === '/bounties') {
    return <BountyWorkspace onNavigate={navigate} />;
  }

  return <Dashboard onNavigateToBounties={() => navigate('/bounties')} />;
}
