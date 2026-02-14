
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { PolicyModalsProvider } from "@/components/PolicyModals";
import ScrollToTop from "@/components/ScrollToTop";
import Index from "./pages/Index";
import Rooms from "./pages/Rooms";
import Login from "./pages/login";
import AdminLogin from "./pages/AdminLogin";
import AdminForgotPassword from "./pages/AdminForgotPassword";
import AdminResetPassword from "./pages/AdminResetPassword";
import AdminHome from "./pages/AdminHome";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminBookings from "./pages/AdminBookings";
import AdminPayments from "./pages/AdminPayments";
import AdminInquiries from "./pages/AdminInquiries";
import AdminPromoCodes from "./pages/AdminPromoCodes";
import Booking from "./pages/booking";
import Tariff from "./pages/Tariff";
import Facilities from "./pages/Facilities";
import Attractions from "./pages/Attractions";
import Gallery from "./pages/Gallery";
import Contact from "./pages/Contact";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ToastContainer position="top-right" autoClose={2500} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover />
      <PolicyModalsProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
            <Route path="/admin/reset-password" element={<AdminResetPassword />} />
            <Route path="/admin" element={<AdminHome />} />
            <Route path="/admin/rooms" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/bookings" element={<AdminBookings />} />
            <Route path="/admin/payments" element={<AdminPayments />} />
            <Route path="/admin/inquiries" element={<AdminInquiries />} />
            <Route path="/admin/promos" element={<AdminPromoCodes />} />
            <Route path="/booking/:id" element={<Booking />} />
            <Route path="/tariff" element={<Tariff />} />
            <Route path="/facilities" element={<Facilities />} />
            <Route path="/attractions" element={<Attractions />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </PolicyModalsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
