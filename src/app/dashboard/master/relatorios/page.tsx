"use client"
import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader, Button, Select, SelectItem, DatePicker, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Spinner } from "@nextui-org/react";
import { BarChartIcon, UsersIcon, CalendarIcon, BuildingIcon, DollarSignIcon, TrendingUpIcon, DownloadIcon } from "lucide-react";
import { useAuth } from "@/context/authContext";
import axios from "axios";
import moment from "moment";
import "moment/locale/pt-br";
import { DateValue, parseDate } from "@internationalized/date";

interface DashboardStats {
  totalUsers: number;
  totalEstablishments: number;
  totalEvents: number;
  totalRevenue: number;
  activeUsers: number;
  activeEvents: number;
  monthlyRevenue: number;
  monthlyEvents: number;
}

interface TopEvent {
  id: string;
  name: string;
  establishment: string;
  revenue: number;
  sales: number;
  date: string;
}

interface TopEstablishment {
  id: string;
  name: string;
  events: number;
  revenue: number;
  owner: string;
}

export default function RelatoriosMasterPage() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topEvents, setTopEvents] = useState<TopEvent[]>([]);
  const [topEstablishments, setTopEstablishments] = useState<TopEstablishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");
  const [startDate, setStartDate] = useState<DateValue | null>(null);
  const [endDate, setEndDate] = useState<DateValue | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchDashboardData();
  }, [token, period, startDate, endDate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (period) params.append('period', period);
      if (startDate) params.append('startDate', startDate.toString());
      if (endDate) params.append('endDate', endDate.toString());

      // 1. Estatísticas gerais
      const statsPromise = axios.get(`/api/admin/stats/overview`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // 2. Todos os eventos (para top eventos)
      const eventsPromise = axios.get(`/api/admin/events/all`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // 3. Profissionais detalhados (para top estabelecimentos)
      const establishmentsPromise = axios.get(`/api/admin/users/professionals-detailed`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const [statsResponse, eventsResponse, establishmentsResponse] = await Promise.all([
        statsPromise, eventsPromise, establishmentsPromise
      ]);

      // Estatísticas gerais
      const statsData = statsResponse.data;
      setStats({
        totalUsers: statsData.totalUsers || 0,
        totalEstablishments: statsData.usersByType?.professionalOwner || 0,
        totalEvents: statsData.totalEvents || 0,
        totalRevenue: statsData.totalTickets || 0, // Usando totalTickets como proxy para receita
        activeUsers: statsData.totalUsers || 0, // Assumindo que todos estão ativos por enquanto
        activeEvents: statsData.activeEvents || 0,
        monthlyRevenue: 0, // Não vem do endpoint, pode ser calculado se necessário
        monthlyEvents: 0 // Não vem do endpoint, pode ser calculado se necessário
      });

      // Top eventos por receita
      const events = eventsResponse.data.events || [];
      const topEventsSorted = [...events]
        .filter(event => !!event.id)
        .sort((a, b) => (b.stats?.totalRevenue || 0) - (a.stats?.totalRevenue || 0))
        .slice(0, 10)
        .map(event => ({
          id: event.id,
          name: event.name || 'Evento sem nome',
          establishment: event.establishment?.name || '-',
          revenue: event.stats?.totalRevenue || 0,
          sales: event.stats?.totalTicketsSold || 0,
          date: event.dateTimestamp || event.createdAt
        }));
      setTopEvents(topEventsSorted);

      // Top estabelecimentos (profissionais com mais receita)
      const professionals = establishmentsResponse.data.professionals || [];
      const topEstablishmentsSorted = [...professionals]
        .map(prof => ({
          id: prof.establishment?.id || prof.user?.uid,
          name: prof.establishment?.name || '-',
          events: prof.stats?.totalEvents || 0,
          revenue: prof.stats?.totalTicketsSold || 0, // Usando totalTicketsSold como proxy para receita
          owner: prof.user?.name || '-'
        }))
        .filter(est => !!est.id)
        .sort((a, b) => (b.revenue || 0) - (a.revenue || 0))
        .slice(0, 10);
      setTopEstablishments(topEstablishmentsSorted);
    } catch (error) {
      console.error('Erro ao buscar dados dos relatórios:', error);
      setStats(null);
      setTopEvents([]);
      setTopEstablishments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async (type: string) => {
    try {
      const params = new URLSearchParams();
      if (period) params.append('period', period);
      if (startDate) params.append('startDate', startDate.toString());
      if (endDate) params.append('endDate', endDate.toString());

      const response = await axios.get(`/api/admin/reports/export/${type}?${params}`, {
        headers: { 'authorization': `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio-${type}-${moment().format('YYYY-MM-DD')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      alert('Erro ao exportar relatório. Tente novamente.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 bg-theme-secondary">
        <Spinner size="lg" color="warning" />
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-theme-secondary min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-theme-primary">Relatórios Gerais</h1>
        <div className="flex gap-2">
          <Button
            color="primary"
            className="bg-accent-primary text-theme-primary border-theme-primary"
            startContent={<DownloadIcon size={20} />}
            onPress={() => handleExportReport('general')}
          >
            Relatório Geral
          </Button>
          <Button
            color="secondary"
            className="bg-accent-primary text-theme-primary border-theme-primary"
            startContent={<DownloadIcon size={20} />}
            onPress={() => handleExportReport('events')}
          >
            Relatório de Eventos
          </Button>
          <Button
            color="success"
            className="bg-accent-primary text-theme-primary border-theme-primary"
            startContent={<DownloadIcon size={20} />}
            onPress={() => handleExportReport('users')}
          >
            Relatório de Usuários
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="bg-theme-secondary border border-theme-primary">
        <CardHeader>
          <h3 className="text-lg font-semibold text-theme-primary">Filtros</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              label="Período"
              className="bg-theme-secondary text-theme-primary border-theme-primary"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              popoverProps={{ className: 'bg-theme-secondary text-theme-primary' }}
            >
              <SelectItem key="7" value="7">Últimos 7 dias</SelectItem>
              <SelectItem key="30" value="30">Últimos 30 dias</SelectItem>
              <SelectItem key="90" value="90">Últimos 90 dias</SelectItem>
              <SelectItem key="365" value="365">Último ano</SelectItem>
            </Select>
            <DatePicker
              label="Data inicial"
              className="bg-theme-secondary text-theme-primary border-theme-primary"
              value={startDate}
              onChange={setStartDate}
            />
            <DatePicker
              label="Data final"
              className="bg-theme-secondary text-theme-primary border-theme-primary"
              value={endDate}
              onChange={setEndDate}
            />
            <Button
              color="primary"
              className="bg-accent-primary text-theme-primary border-theme-primary"
              onPress={fetchDashboardData}
            >
              Aplicar Filtros
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Estatísticas Gerais */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-theme-secondary border border-theme-primary">
            <CardBody className="text-center">
              <UsersIcon size={32} className="mx-auto mb-2 text-accent-primary" />
              <p className="text-2xl font-bold text-theme-primary">{stats.totalUsers.toLocaleString('pt-BR')}</p>
              <p className="text-sm text-theme-primary">Total de Usuários</p>
              <p className="text-xs text-green-500 mt-1">
                {stats.activeUsers} ativos
              </p>
            </CardBody>
          </Card>

          <Card className="bg-theme-secondary border border-theme-primary">
            <CardBody className="text-center">
              <BuildingIcon size={32} className="mx-auto mb-2 text-accent-primary" />
              <p className="text-2xl font-bold text-theme-primary">{stats.totalEstablishments.toLocaleString('pt-BR')}</p>
              <p className="text-sm text-theme-primary">Estabelecimentos</p>
            </CardBody>
          </Card>

          <Card className="bg-theme-secondary border border-theme-primary">
            <CardBody className="text-center">
              <CalendarIcon size={32} className="mx-auto mb-2 text-accent-primary" />
              <p className="text-2xl font-bold text-theme-primary">{stats.totalEvents.toLocaleString('pt-BR')}</p>
              <p className="text-sm text-theme-primary">Total de Eventos</p>
              <p className="text-xs text-green-500 mt-1">
                {stats.activeEvents} ativos
              </p>
            </CardBody>
          </Card>

          <Card className="bg-theme-secondary border border-theme-primary">
            <CardBody className="text-center">
              <DollarSignIcon size={32} className="mx-auto mb-2 text-accent-primary" />
              <p className="text-2xl font-bold text-theme-primary">R$ {stats.totalRevenue.toLocaleString('pt-BR')}</p>
              <p className="text-sm text-theme-primary">Receita Total</p>
              <p className="text-xs text-green-500 mt-1">
                R$ {stats.monthlyRevenue.toLocaleString('pt-BR')} este mês
              </p>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Top Eventos */}
      <Card className="bg-theme-secondary border border-theme-primary">
        <CardHeader>
          <h3 className="text-lg font-semibold text-theme-primary">Top Eventos por Receita</h3>
        </CardHeader>
        <CardBody>
          <div className="table-container">
            <Table aria-label="Top eventos" className="table-theme">
              <TableHeader>
                <TableColumn className="text-theme-primary">EVENTO</TableColumn>
                <TableColumn className="text-theme-primary">ESTABELECIMENTO</TableColumn>
                <TableColumn className="text-theme-primary">DATA</TableColumn>
                <TableColumn className="text-theme-primary">VENDAS</TableColumn>
                <TableColumn className="text-theme-primary">RECEITA</TableColumn>
              </TableHeader>
              <TableBody items={topEvents}>
                {(event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium text-theme-primary">{event.name}</TableCell>
                    <TableCell className="text-theme-primary">{event.establishment}</TableCell>
                    <TableCell className="text-theme-primary">{moment(event.date).format('DD/MM/YYYY')}</TableCell>
                    <TableCell>
                      <Chip color="primary" variant="flat">
                        {event.sales} vendas
                      </Chip>
                    </TableCell>
                    <TableCell className="font-bold text-green-500">
                      R$ {event.revenue.toLocaleString('pt-BR')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardBody>
      </Card>

      {/* Top Estabelecimentos */}
      <Card className="bg-theme-secondary border border-theme-primary">
        <CardHeader>
          <h3 className="text-lg font-semibold text-theme-primary">Top Estabelecimentos</h3>
        </CardHeader>
        <CardBody>
          <div className="table-container">
            <Table aria-label="Top estabelecimentos" className="table-theme">
              <TableHeader>
                <TableColumn className="text-theme-primary">ESTABELECIMENTO</TableColumn>
                <TableColumn className="text-theme-primary">PROPRIETÁRIO</TableColumn>
                <TableColumn className="text-theme-primary">EVENTOS</TableColumn>
                <TableColumn className="text-theme-primary">RECEITA</TableColumn>
              </TableHeader>
              <TableBody items={topEstablishments}>
                {(establishment) => (
                  <TableRow key={establishment.id}>
                    <TableCell className="font-medium text-theme-primary">{establishment.name}</TableCell>
                    <TableCell className="text-theme-primary">{establishment.owner}</TableCell>
                    <TableCell>
                      <Chip color="secondary" variant="flat">
                        {establishment.events} eventos
                      </Chip>
                    </TableCell>
                    <TableCell className="font-bold text-green-500">
                      R$ {establishment.revenue.toLocaleString('pt-BR')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardBody>
      </Card>

      {/* Gráficos (placeholder para futuras implementações) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-theme-secondary border border-theme-primary">
          <CardHeader>
            <h3 className="text-lg font-semibold text-theme-primary">Receita Mensal</h3>
          </CardHeader>
          <CardBody>
            <div className="h-64 flex items-center justify-center text-theme-primary">
              <div className="text-center">
                <BarChartIcon size={48} className="mx-auto mb-2 text-accent-primary" />
                <p>Gráfico de receita mensal</p>
                <p className="text-sm">(Implementação futura)</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-theme-secondary border border-theme-primary">
          <CardHeader>
            <h3 className="text-lg font-semibold text-theme-primary">Crescimento de Usuários</h3>
          </CardHeader>
          <CardBody>
            <div className="h-64 flex items-center justify-center text-theme-primary">
              <div className="text-center">
                <TrendingUpIcon size={48} className="mx-auto mb-2 text-accent-primary" />
                <p>Gráfico de crescimento</p>
                <p className="text-sm">(Implementação futura)</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
} 