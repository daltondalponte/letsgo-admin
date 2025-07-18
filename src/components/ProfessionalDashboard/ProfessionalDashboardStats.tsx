"use client"

import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader, Spinner } from "@nextui-org/react";
import { CalendarIcon, TicketIcon, TrendingUpIcon, AlertTriangleIcon, DollarSignIcon, UsersIcon } from "lucide-react";
import { useAuth } from "@/context/authContext";
import axios from "axios";

interface ProfessionalStats {
  totalEvents: number;
  activeEvents: number;
  completedEvents: number;
  totalTickets: number;
  totalRevenue: number;
  totalCupons: number;
}

export default function ProfessionalDashboardStats() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<ProfessionalStats | null>(null);
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
      
      // Buscar estatísticas do usuário
      const response = await axios.get('/api/professional/stats', {
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
        totalEvents: 0,
        activeEvents: 0,
        completedEvents: 0,
        totalTickets: 0,
        totalRevenue: 0,
        totalCupons: 0
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

  const getEventPercentage = () => {
    return stats.totalEvents > 0 ? ((stats.activeEvents / stats.totalEvents) * 100).toFixed(1) : '0';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total de Eventos */}
      <Card className="bg-theme-secondary border border-theme-primary hover:shadow-lg transition-all duration-300">
        <CardBody className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-theme-tertiary">Meus Eventos</p>
              <p className="text-3xl font-bold text-theme-primary">{stats.totalEvents}</p>
              <p className="text-xs text-theme-secondary mt-1">
                {stats.activeEvents} ativos • {stats.completedEvents} finalizados
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <CalendarIcon size={24} className="text-blue-600" />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Tickets Disponíveis */}
      <Card className="bg-theme-secondary border border-theme-primary hover:shadow-lg transition-all duration-300">
        <CardBody className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-theme-tertiary">Tickets Disponíveis</p>
              <p className="text-3xl font-bold text-theme-primary">{stats.totalTickets}</p>
              <p className="text-xs text-theme-secondary mt-1">
                Total de ingressos criados
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TicketIcon size={24} className="text-green-600" />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Receita Total */}
      <Card className="bg-theme-secondary border border-theme-primary hover:shadow-lg transition-all duration-300">
        <CardBody className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-theme-tertiary">Receita Total</p>
              <p className="text-3xl font-bold text-theme-primary">
                R$ {stats.totalRevenue.toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-theme-secondary mt-1">
                Valor total dos ingressos
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <DollarSignIcon size={24} className="text-yellow-600" />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Cupons */}
      <Card className="bg-theme-secondary border border-theme-primary hover:shadow-lg transition-all duration-300">
        <CardBody className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-theme-tertiary">Cupons Criados</p>
              <p className="text-3xl font-bold text-theme-primary">{stats.totalCupons}</p>
              <p className="text-xs text-theme-secondary mt-1">
                Cupons de desconto ativos
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <UsersIcon size={24} className="text-purple-600" />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Taxa de Atividade */}
      <Card className="bg-theme-secondary border border-theme-primary lg:col-span-2 hover:shadow-lg transition-all duration-300">
        <CardBody className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-theme-tertiary">Taxa de Atividade</p>
              <p className="text-3xl font-bold text-green-600">
                {getEventPercentage()}%
              </p>
              <p className="text-xs text-theme-secondary mt-1">
                Eventos ativos em relação ao total
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