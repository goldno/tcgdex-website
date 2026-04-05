import { HashRouter, Routes, Route } from 'react-router-dom';
import CardsPage from './pages/CardsPage';
import CardDetailPage from './pages/CardDetailPage';
import './App.css';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<CardsPage />} />
        <Route path="/cards/:id" element={<CardDetailPage />} />
      </Routes>
    </HashRouter>
  );
}
