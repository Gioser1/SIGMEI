import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Layout from '../pages/Layout';
import Dashboard from '../pages/Dashboard';
import Equipos from '../pages/Equipos';
import Incidencias from '../pages/Incidencias';
import Mantenimientos from '../pages/Mantenimientos';
import ProtectedRoute from '../components/ProtectedRoute';
import MyPC from '../pages/MyPC';
import SoporteRemoto from '../pages/SoporteRemoto';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* Rutas protegidas */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/equipos" element={<Equipos />} />
          <Route path="/mi-pc" element={<MyPC />} />
          <Route path="/incidencias" element={<Incidencias />} />
          <Route path="/mantenimientos" element={<Mantenimientos />} />
          <Route path="/soporte-remoto" element={<SoporteRemoto />} />
        </Route>
      </Route>

      {/* Redirección para rutas no encontradas */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
