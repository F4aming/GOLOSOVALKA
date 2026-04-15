import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import './styles/main.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import CreatePoll from './pages/CreatePoll';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PollPage from './pages/PollPage';
import PollCreator from './pages/PollCreator';
import PollViewer from './pages/PollViewer';
import AboutPage from './pages/AboutPage';

const App: React.FC = () => {
  const basename = process.env.NODE_ENV === 'production' ? '/voting-platform' : '/';


  return (
    <Router basename={basename}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/create" element={<CreatePoll />} />
        <Route path="/create-vote" element={<PollCreator />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/vote/:id" element={<PollPage />} />
        <Route path="/poll/:id" element={<PollViewer />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
    </Router>
  );
};
export default App;
