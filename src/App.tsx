import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Payment from './pages/Payment';
import Admin from './pages/Admin';
import PickupPayment from './pages/PickupPayment';
import PickupOnlinePayment from './pages/PickupOnlinePayment';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/pickup-payment" element={<PickupPayment />} />
        <Route path="/pickup-online-payment" element={<PickupOnlinePayment />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
}

export default App;
