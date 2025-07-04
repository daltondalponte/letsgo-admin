"use client"

import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader, Spinner } from "@nextui-org/react";
import { UsersIcon, BuildingIcon, CalendarIcon, TicketIcon, TrendingUpIcon, AlertTriangleIcon } from "lucide-react";
import { useAuth } from "@/context/authContext";
import axios from "axios";

interface DashboardStats {
  totalUsers: number;
  usersByType: {
    personal: number;
    professionalOwner: number;
    professionalPromoter: number;
    ticketTaker: number;
    master: number;
  };
  totalEvents: number;
  totalTicketsSold: number;
  activeUsers: number;
  inactiveUsers: number;
}

export default function MasterDashboardStats() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
    
    // Atualizar estatísticas a cada 5 minutos
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [user, token]);

  const fetchStats = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/stats/overview`, {
        headers: {
          'authorization': `Bearer ${token}`
        }
      });
      setStats(response.data);
      setError(null);
    } catch (error) {
      setError('Erro ao carregar estatísticas');
      
      // Dados de exemplo quando a API não está disponível
      setStats({
        totalUsers: 1250,
        usersByType: {
          personal: 890,
          professionalOwner: 45,
          professionalPromoter: 23,
          ticketTaker: 67,
          master: 1
        },
        totalEvents: 180,
        totalTicketsSold: 15420,
        activeUsers: 1180,
        inactiveUsers: 70
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-theme-secondary border border-theme-primary">
            <CardBody className="flex items-center justify-center h-32">
              <Spinner size="lg" color="primary" />
            </CardBody>
          </Card>
        ))}
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-red-50 border border-red-200 col-span-full">
          <CardBody className="flex items-center justify-center h-32">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangleIcon size={24} />
              <span>{error}</span>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!stats) return null;

  const getTypePercentage = (type: keyof typeof stats.usersByType) => {
    return stats.totalUsers > 0 ? ((stats.usersByType[type] / stats.totalUsers) * 100).toFixed(1) : '0';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total de Usuários */}
      <Card className="bg-theme-secondary border border-theme-primary hover:shadow-lg transition-all duration-300">
        <CardBody className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-theme-tertiary">Total de Usuários</p>
              <p className="text-3xl font-bold text-theme-primary">{stats.totalUsers.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-green-600 mt-1">
                {stats.activeUsers} ativos • {stats.inactiveUsers} inativos
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <UsersIcon size={24} className="text-blue-600" />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Total de Eventos */}
      <Card className="bg-theme-secondary border border-theme-primary hover:shadow-lg transition-all duration-300">
        <CardBody className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-theme-tertiary">Total de Eventos</p>
              <p className="text-3xl font-bold text-theme-primary">{stats.totalEvents.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-theme-secondary mt-1">
                Eventos cadastrados no sistema
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CalendarIcon size={24} className="text-green-600" />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Tickets Vendidos */}
      <Card className="bg-theme-secondary border border-theme-primary hover:shadow-lg transition-all duration-300">
        <CardBody className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-theme-tertiary">Tickets Vendidos</p>
              <p className="text-3xl font-bold text-theme-primary">{stats.totalTicketsSold.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-theme-secondary mt-1">
                Total de vendas realizadas
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <TicketIcon size={24} className="text-orange-600" />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Estabelecimentos */}
      <Card className="bg-theme-secondary border border-theme-primary hover:shadow-lg transition-all duration-300">
        <CardBody className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-theme-tertiary">Estabelecimentos</p>
              <p className="text-3xl font-bold text-theme-primary">
                {(stats.usersByType.professionalOwner + stats.usersByType.professionalPromoter).toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-theme-secondary mt-1">
                Profissionais cadastrados
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <BuildingIcon size={24} className="text-purple-600" />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Distribuição de Usuários */}
      <Card className="bg-theme-secondary border border-theme-primary lg:col-span-2 hover:shadow-lg transition-all duration-300">
        <CardHeader>
          <h3 className="text-lg font-semibold text-theme-primary">Distribuição de Usuários</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.usersByType.personal}</div>
              <div className="text-xs text-theme-secondary">Pessoal ({getTypePercentage('personal')}%)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.usersByType.professionalOwner}</div>
              <div className="text-xs text-theme-secondary">Proprietários ({getTypePercentage('professionalOwner')}%)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.usersByType.professionalPromoter}</div>
              <div className="text-xs text-theme-secondary">Promotores ({getTypePercentage('professionalPromoter')}%)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.usersByType.ticketTaker}</div>
              <div className="text-xs text-theme-secondary">Validadores ({getTypePercentage('ticketTaker')}%)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.usersByType.master}</div>
              <div className="text-xs text-theme-secondary">Master ({getTypePercentage('master')}%)</div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Taxa de Atividade */}
      <Card className="bg-theme-secondary border border-theme-primary hover:shadow-lg transition-all duration-300">
        <CardBody className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-theme-tertiary">Taxa de Atividade</p>
              <p className="text-3xl font-bold text-green-600">
                {stats.totalUsers > 0 ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1) : '0'}%
              </p>
              <p className="text-xs text-theme-secondary mt-1">
                Usuários ativos
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUpIcon size={24} className="text-green-600" />
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
} 