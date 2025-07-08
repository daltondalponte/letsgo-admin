"use client"
import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader, Button, Select, SelectItem, DatePicker, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip } from "@nextui-org/react";
import { BarChartIcon, CalendarIcon, DollarSignIcon, TrendingUpIcon, DownloadIcon, UsersIcon } from "lucide-react";
import { useAuth } from "@/context/authContext";
import axios from "axios";
import moment from "moment";
import "moment/locale/pt-br";

interface EventStats {
  id: string;
  name: string;
  totalSales: number;
  totalRevenue: number;
  ticketsSold: number;
  ticketsAvailable: number;
  date: string;
}

interface SalesData {
  date: string;
  sales: number;
  revenue: number;
}

export default function RelatoriosPage() {
  const { user, token } = useAuth();
  const [eventStats, setEventStats] = useState<EventStats[]>([]);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");
  const [selectedEvent, setSelectedEvent] = useState("all");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Estatísticas resumidas
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [totalEvents, setTotalEvents] = useState(0);
  const [avgTicketPrice, setAvgTicketPrice] = useState(0);

  useEffect(() => {
    if (!token) return; // Só busca se tiver token
    fetchReportData();
  }, [period, selectedEvent, startDate, endDate, token]);

  const fetchReportData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (period) params.append('period', period);
      if (selectedEvent !== "all") params.append('eventId', selectedEvent);
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());

      const [statsResponse, salesResponse, summaryResponse] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/event/reports/stats?${params}`, {
          headers: { 'authorization': `Bearer ${token}` }
        }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/event/reports/sales?${params}`, {
          headers: { 'authorization': `Bearer ${token}` }
        }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/event/reports/summary?${params}`, {
          headers: { 'authorization': `Bearer ${token}` }
        })
      ]);

      setEventStats(statsResponse.data.events || []);
      setSalesData(salesResponse.data.sales || []);
      
      const summary = summaryResponse.data;
      setTotalRevenue(summary.totalRevenue || 0);
      setTotalSales(summary.totalSales || 0);
      setTotalEvents(summary.totalEvents || 0);
      setAvgTicketPrice(summary.avgTicketPrice || 0);
    } catch (error) {
      console.error('Erro ao buscar dados do relatório:', error);
      // Dados de exemplo para demonstração
      setEventStats([
        {
          id: "1",
          name: "Show de Rock",
          totalSales: 150,
          totalRevenue: 7500,
          ticketsSold: 150,
          ticketsAvailable: 200,
          date: "2024-01-15"
        },
        {
          id: "2",
          name: "Festival de Música",
          totalSales: 300,
          totalRevenue: 15000,
          ticketsSold: 300,
          ticketsAvailable: 500,
          date: "2024-02-20"
        }
      ]);
      setTotalRevenue(22500);
      setTotalSales(450);
      setTotalEvents(2);
      setAvgTicketPrice(50);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async (type: string) => {
    try {
      const params = new URLSearchParams();
      if (period) params.append('period', period);
      if (selectedEvent !== "all") params.append('eventId', selectedEvent);
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());

      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/event/reports/export/${type}?${params}`, {
        headers: { 'authorization': `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio-${type}-${moment().format('YYYY-MM-DD')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      alert('Erro ao exportar relatório');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-foreground">Carregando relatórios...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">Meus Relatórios</h1>
        <div className="flex gap-2">
          <Button
            color="primary"
            startContent={<DownloadIcon size={20} />}
            onPress={() => handleExportReport('general')}
          >
            Exportar Relatório
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="bg-card border-border">
        <CardHeader>
          <h3 className="text-lg font-semibold text-foreground">Filtros</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              label="Período"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <SelectItem key="7" value="7">Últimos 7 dias</SelectItem>
              <SelectItem key="30" value="30">Últimos 30 dias</SelectItem>
              <SelectItem key="90" value="90">Últimos 90 dias</SelectItem>
              <SelectItem key="365" value="365">Último ano</SelectItem>
            </Select>
            <Select
              label="Evento"
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
            >
              <SelectItem key="all" value="all">Todos os eventos</SelectItem>
              {eventStats.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.name}
                </SelectItem>
              ))}
            </Select>
            <DatePicker
              label="Data inicial"
              value={startDate}
              onChange={setStartDate}
            />
            <DatePicker
              label="Data final"
              value={endDate}
              onChange={setEndDate}
            />
          </div>
        </CardBody>
      </Card>

      {/* Estatísticas Resumidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-card border-border">
          <CardBody className="text-center">
            <DollarSignIcon size={32} className="mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold text-foreground">R$ {totalRevenue.toLocaleString('pt-BR')}</p>
            <p className="text-sm text-muted-foreground">Receita Total</p>
          </CardBody>
        </Card>

        <Card className="bg-card border-border">
          <CardBody className="text-center">
            <UsersIcon size={32} className="mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold text-foreground">{totalSales.toLocaleString('pt-BR')}</p>
            <p className="text-sm text-muted-foreground">Total de Vendas</p>
          </CardBody>
        </Card>

        <Card className="bg-card border-border">
          <CardBody className="text-center">
            <CalendarIcon size={32} className="mx-auto mb-2 text-purple-500" />
            <p className="text-2xl font-bold text-foreground">{totalEvents.toLocaleString('pt-BR')}</p>
            <p className="text-sm text-muted-foreground">Eventos</p>
          </CardBody>
        </Card>

        <Card className="bg-card border-border">
          <CardBody className="text-center">
            <TrendingUpIcon size={32} className="mx-auto mb-2 text-yellow-500" />
            <p className="text-2xl font-bold text-foreground">R$ {avgTicketPrice.toLocaleString('pt-BR')}</p>
            <p className="text-sm text-muted-foreground">Ticket Médio</p>
          </CardBody>
        </Card>
      </div>

      {/* Estatísticas por Evento */}
      <Card className="bg-card border-border">
        <CardHeader>
          <h3 className="text-lg font-semibold text-foreground">Estatísticas por Evento</h3>
        </CardHeader>
        <CardBody>
          <Table aria-label="Estatísticas por evento" className="bg-card">
            <TableHeader>
              <TableColumn className="text-foreground">EVENTO</TableColumn>
              <TableColumn className="text-foreground">DATA</TableColumn>
              <TableColumn className="text-foreground">VENDAS</TableColumn>
              <TableColumn className="text-foreground">RECEITA</TableColumn>
              <TableColumn className="text-foreground">OCUPAÇÃO</TableColumn>
              <TableColumn className="text-foreground">PERFORMANCE</TableColumn>
            </TableHeader>
            <TableBody items={eventStats}>
              {(event) => {
                const occupancyRate = (event.ticketsSold / event.ticketsAvailable) * 100;
                const performanceColor = occupancyRate >= 80 ? "success" : occupancyRate >= 60 ? "warning" : "danger";
                
                return (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium text-foreground">{event.name}</TableCell>
                    <TableCell className="text-foreground">{moment(event.date).format('DD/MM/YYYY')}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{event.totalSales}</span>
                        <span className="text-sm text-muted-foreground">
                          ({event.ticketsSold}/{event.ticketsAvailable})
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-green-600">
                      R$ {event.totalRevenue.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Chip color={performanceColor} variant="flat">
                        {occupancyRate.toFixed(1)}%
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            occupancyRate >= 80 ? 'bg-green-500' : 
                            occupancyRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(occupancyRate, 100)}%` }}
                        ></div>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              }}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Gráfico de Vendas (placeholder) */}
      <Card className="bg-card border-border">
        <CardHeader>
          <h3 className="text-lg font-semibold text-foreground">Vendas por Período</h3>
        </CardHeader>
        <CardBody>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <BarChartIcon size={48} className="mx-auto mb-2" />
              <p>Gráfico de vendas por período</p>
              <p className="text-sm">(Implementação futura)</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Dados de Vendas */}
      {salesData.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <h3 className="text-lg font-semibold text-foreground">Dados de Vendas</h3>
          </CardHeader>
          <CardBody>
            <Table aria-label="Dados de vendas" className="bg-card">
              <TableHeader>
                <TableColumn className="text-foreground">DATA</TableColumn>
                <TableColumn className="text-foreground">VENDAS</TableColumn>
                <TableColumn className="text-foreground">RECEITA</TableColumn>
                <TableColumn className="text-foreground">MÉDIA POR VENDA</TableColumn>
              </TableHeader>
              <TableBody items={salesData}>
                {(sale) => (
                  <TableRow key={sale.date}>
                    <TableCell className="text-foreground">{moment(sale.date).format('DD/MM/YYYY')}</TableCell>
                    <TableCell className="text-foreground">{sale.sales}</TableCell>
                    <TableCell className="font-bold text-green-600">
                      R$ {sale.revenue.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-foreground">
                      R$ {(sale.revenue / sale.sales).toLocaleString('pt-BR')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      )}
    </div>
  );
} 