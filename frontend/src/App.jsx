import React from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { homePath, useAuth } from './auth.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import ChildrenList from './pages/ChildrenList.jsx';
import ChildWorkspace from './pages/ChildWorkspace.jsx';
import ChildHome from './pages/ChildHome.jsx';

export function RequireRole({ roles }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="muted center">Yükleniyor…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to={homePath(user)} replace />;
  return <Outlet />;
}

function Home() {
  const { user, loading } = useAuth();
  if (loading) return <p className="muted center">Yükleniyor…</p>;
  return <Navigate to={user ? homePath(user) : '/login'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Layout />}>
        <Route element={<RequireRole roles={['parent', 'specialist']} />}>
          <Route path="/children" element={<ChildrenList />} />
          <Route path="/children/:childId" element={<ChildWorkspace />} />
        </Route>
        <Route element={<RequireRole roles={['child']} />}>
          <Route path="/my" element={<ChildHome />} />
        </Route>
      </Route>
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
