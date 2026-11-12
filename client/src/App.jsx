import { Navigate, Route, Routes } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop.jsx';
import PublicLayout from './components/PublicLayout.jsx';
import AdminLayout from './components/AdminLayout.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';

import Home from './pages/public/Home.jsx';
import Cars from './pages/public/Cars.jsx';
import CarDetail from './pages/public/CarDetail.jsx';
import Book from './pages/public/Book.jsx';
import ThankYou from './pages/public/ThankYou.jsx';
import NotFound from './pages/public/NotFound.jsx';

import AdminLogin from './pages/admin/Login.jsx';
import AdminInquiries from './pages/admin/Inquiries.jsx';
import AdminCars from './pages/admin/Cars.jsx';

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* ---------- Client side: public, no login ---------- */}
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="cars" element={<Cars />} />
          <Route path="cars/:id" element={<CarDetail />} />
          <Route path="book" element={<Book />} />
          <Route path="thank-you" element={<ThankYou />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* ---------- Admin side ---------- */}
        <Route path="admin/login" element={<AdminLogin />} />

        {/* everything under /admin needs a valid login */}
        <Route path="admin" element={<PrivateRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="inquiries" replace />} />
            <Route path="inquiries" element={<AdminInquiries />} />
            <Route path="cars" element={<AdminCars />} />
            <Route path="*" element={<Navigate to="/admin/inquiries" replace />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}
