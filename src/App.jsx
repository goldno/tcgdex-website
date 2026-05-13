import { HashRouter, Routes, Route, Outlet } from 'react-router-dom';
import Nav from './components/Nav';
import CardsPage from './pages/CardsPage';
import CardDetailPage from './pages/CardDetailPage';
import SupportLinesPage from './pages/SupportLinesPage';
import MomentumPage from './pages/MomentumPage';
import './App.css';

function Layout() {
  return (
    <>
      <Nav />
      <Outlet />
    </>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<CardsPage />} />
          <Route path="/cards/:id" element={<CardDetailPage />} />
          <Route path="/support-lines" element={<SupportLinesPage />} />
          <Route path="/momentum" element={<MomentumPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
