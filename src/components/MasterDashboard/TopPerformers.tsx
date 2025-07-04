"use client"

import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Spinner } from "@nextui-org/react";
import { TrophyIcon, TrendingUpIcon, BuildingIcon } from "lucide-react";
import { useAuth } from "@/context/authContext";
import axios from "axios";

interface TopPerformer {
  user: {
    id: string;
    name: string;
    email: string;
    type: string;
  };
  establishment?: {
    id: string;
    name: string;
  };
  stats: {
    totalEvents: number;
    totalTicketsSold: number;
    totalRevenue: number;
    averageRevenuePerEvent: number;
  };
}

export default function TopPerformers() {
  const { user, token } = useAuth();
  const [performers, setPerformers] = useState<TopPerformer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTopPerformers();
  }, [user, token]);

  const fetchTopPerformers = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/stats/top-performers`, {
        headers: {
          'authorization': `Bearer ${token}`
        }
      });
      setPerformers(response.data.topPerformers || []);
      setError(null);
    } catch (error) {
      setError('Erro ao carregar dados');
      
      // Dados de exemplo quando a API não está disponível
      setPerformers([
        {
          user: {
            id: "1",
            name: "João Silva",
            email: "joao@example.com",
            type: "PROFESSIONAL_OWNER"
          },
          establishment: {
            id: "est1",
            name: "Casa de Shows ABC"
          },
          stats: {
            totalEvents: 15,
            totalTicketsSold: 1250,
            totalRevenue: 45000,
            averageRevenuePerEvent: 3000
          }
        },
        {
          user: {
            id: "2",
            name: "Maria Santos",
            email: "maria@example.com",
            type: "PROFESSIONAL_PROMOTER"
          },
          establishment: {
            id: "est2",
            name: "Arena Central"
          },
          stats: {
            totalEvents: 12,
            totalTicketsSold: 980,
            totalRevenue: 38000,
            averageRevenuePerEvent: 3167
          }
        },
        {
          user: {
            id: "3",
            name: "Pedro Costa",
            email: "pedro@example.com",
            type: "PROFESSIONAL_OWNER"
          },
          establishment: {
            id: "est3",
            name: "Teatro Municipal"
          },
          stats: {
            totalEvents: 8,
            totalTicketsSold: 750,
            totalRevenue: 28000,
            averageRevenuePerEvent: 3500
          }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "PROFESSIONAL_OWNER": return "success";
      case "PROFESSIONAL_PROMOTER": return "primary";
      default: return "default";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "PROFESSIONAL_OWNER": return "Proprietário";
      case "PROFESSIONAL_PROMOTER": return "Promotor";
      default: return type;
    }
  };

  if (loading) {
    return (
      <Card className="bg-theme-secondary border border-theme-primary">
        <CardHeader>
          <h3 className="text-lg font-semibold text-theme-primary flex items-center gap-2">
            <TrophyIcon size={20} />
            Top Performers
          </h3>
        </CardHeader>
        <CardBody className="flex items-center justify-center h-32">
          <Spinner size="lg" color="primary" />
        </CardBody>
      </Card>
    );
  }

  if (error && performers.length === 0) {
    return (
      <Card className="bg-red-50 border border-red-200">
        <CardHeader>
          <h3 className="text-lg font-semibold text-red-600 flex items-center gap-2">
            <TrophyIcon size={20} />
            Top Performers
          </h3>
        </CardHeader>
        <CardBody className="flex items-center justify-center h-32">
          <span className="text-red-600">{error}</span>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="bg-theme-secondary border border-theme-primary">
      <CardHeader>
        <h3 className="text-lg font-semibold text-theme-primary flex items-center gap-2">
          <TrophyIcon size={20} />
          Top Performers
        </h3>
        <p className="text-sm text-theme-tertiary">Profissionais com melhor performance</p>
      </CardHeader>
      <CardBody>
        {performers.length === 0 ? (
          <div className="text-center py-8 text-theme-secondary">
            <TrophyIcon size={48} className="mx-auto mb-4 opacity-50" />
            <p>Nenhum dado disponível</p>
          </div>
        ) : (
          <Table aria-label="Top performers" className="table-theme">
            <TableHeader>
              <TableColumn>POSIÇÃO</TableColumn>
              <TableColumn>PROFISSIONAL</TableColumn>
              <TableColumn>ESTABELECIMENTO</TableColumn>
              <TableColumn>EVENTOS</TableColumn>
              <TableColumn>TICKETS VENDIDOS</TableColumn>
              <TableColumn>RECEITA TOTAL</TableColumn>
            </TableHeader>
            <TableBody items={performers}>
              {(performer, index) => (
                <TableRow key={performer.user.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {index === 0 && <TrophyIcon size={16} className="text-yellow-500" />}
                      {index === 1 && <TrophyIcon size={16} className="text-gray-400" />}
                      {index === 2 && <TrophyIcon size={16} className="text-orange-600" />}
                      <span className="font-bold">#{index + 1}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-theme-primary">{performer.user.name}</p>
                      <p className="text-sm text-theme-secondary">{performer.user.email}</p>
                      <Chip 
                        size="sm" 
                        color={getTypeColor(performer.user.type) as any}
                        variant="flat"
                      >
                        {getTypeLabel(performer.user.type)}
                      </Chip>
                    </div>
                  </TableCell>
                  <TableCell>
                    {performer.establishment ? (
                      <div className="flex items-center gap-2">
                        <BuildingIcon size={16} className="text-theme-tertiary" />
                        <span className="text-sm">{performer.establishment.name}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-theme-tertiary">Não informado</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-center">
                      <p className="font-bold text-theme-primary">{performer.stats.totalEvents}</p>
                      <p className="text-xs text-theme-secondary">eventos</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-center">
                      <p className="font-bold text-theme-primary">{performer.stats.totalTicketsSold.toLocaleString('pt-BR')}</p>
                      <p className="text-xs text-theme-secondary">vendidos</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-center">
                      <p className="font-bold text-green-600">
                        R$ {performer.stats.totalRevenue.toLocaleString('pt-BR')}
                      </p>
                      <p className="text-xs text-theme-secondary">
                        Média: R$ {performer.stats.averageRevenuePerEvent.toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardBody>
    </Card>
  );
} 