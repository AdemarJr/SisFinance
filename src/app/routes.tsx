import { Routes, Route } from "react-router";
import { Layout } from "./components/Layout";
import DashboardMulti from "./pages/DashboardMulti";
import { Lancamentos } from "./pages/Lancamentos";
import { ContasPagar } from "./pages/ContasPagar";
import { ContasReceber } from "./pages/ContasReceber";
import { Clientes } from "./pages/Clientes";
import { Fornecedores } from "./pages/Fornecedores";
import { Contas } from "./pages/Contas";
import { Relatorios } from "./pages/Relatorios";
import Empresas from "./pages/Empresas";
import Funcionarios from "./pages/Funcionarios";
import Estoque from "./pages/Estoque";
import FechamentoCaixa from "./pages/FechamentoCaixa";
import IntegracaoPyrouStock from "./pages/IntegracaoPyrouStock";
import { LandingPage } from "./pages/LandingPage";
import { NotFound } from "./pages/NotFound";
import { Login } from "./pages/Login";
import { Admin } from "./pages/Admin";
import { ProtectedRoute } from "./components/ProtectedRoute";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardMulti />} />
        <Route 
          path="admin" 
          element={
            <ProtectedRoute requireSuperAdmin>
              <Admin />
            </ProtectedRoute>
          } 
        />
        <Route path="empresas" element={<Empresas />} />
        <Route path="lancamentos" element={<Lancamentos />} />
        <Route path="contas-pagar" element={<ContasPagar />} />
        <Route path="contas-receber" element={<ContasReceber />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="fornecedores" element={<Fornecedores />} />
        <Route path="funcionarios" element={<Funcionarios />} />
        <Route path="estoque" element={<Estoque />} />
        <Route path="fechamento-caixa" element={<FechamentoCaixa />} />
        <Route path="contas" element={<Contas />} />
        <Route path="relatorios" element={<Relatorios />} />
        <Route path="integracao-pyrou-stock" element={<IntegracaoPyrouStock />} />
      </Route>
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}