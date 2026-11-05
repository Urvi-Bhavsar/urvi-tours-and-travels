import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import CarList from './pages/CarList';
import CarDetail from './pages/CarDetail';
import InquiryForm from './pages/InquiryForm';
import ThankYou from './pages/ThankYou';
import Contact from './pages/Contact';
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import Cars from './pages/admin/Cars';
import Inquiries from './pages/admin/Inquiries';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/cars" element={<CarList />} />
            <Route path="/cars/:id" element={<CarDetail />} />
            <Route path="/inquiry/:id" element={<InquiryForm />} />
            <Route path="/thank-you" element={<ThankYou />} />
            <Route path="/contact" element={<Contact />} />
            
            {/* Admin routes */}
            <Route path="/admin/login" element={<Login />} />
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/cars" 
              element={
                <ProtectedRoute>
                  <Cars />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/inquiries" 
              element={
                <ProtectedRoute>
                  <Inquiries />
                </ProtectedRoute>
              } 
            />
            {/* More admin routes will be added */}
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
