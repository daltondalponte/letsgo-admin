"use client"
import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button, Input, Select, SelectItem, Chip, Pagination, useDisclosure, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/react";
import { SearchIcon, FilterIcon, DownloadIcon, EyeIcon } from "lucide-react";
import { RefreshCw } from "lucide-react";
import { useAuth } from "@/context/authContext";
import axios from "axios";
import moment from "moment";
import "moment/locale/pt-br";

interface LogEntry {
  id: string;
  level: "INFO" | "WARNING" | "ERROR" | "DEBUG";
  message: string;
  userId?: string;
  userName?: string;
  action: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  details?: any;
}

export default function LogsMasterPage() {
  const { user, token } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const rowsPerPage = 50;

  useEffect(() => {
    fetchLogs();
  }, [levelFilter, actionFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (levelFilter !== "all") params.append('level', levelFilter);
      if (actionFilter !== "all") params.append('action', actionFilter);

      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/logs?${params}`, {
        headers: {
          'authorization': `Bearer ${token}`
        }
      });
      setLogs(response.data.logs || []);
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      // Logs de exemplo para demonstração
      setLogs([
        {
          id: "1",
          level: "INFO",
          message: "Usuário fez login com sucesso",
          userId: "user123",
          userName: "João Silva",
          action: "LOGIN",
          ipAddress: "192.168.1.100",
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          timestamp: new Date().toISOString(),
          details: { email: "joao@example.com" }
        },
        {
          id: "2",
          level: "WARNING",
          message: "Tentativa de login com senha incorreta",
          userId: "user456",
          userName: "Maria Santos",
          action: "LOGIN_ATTEMPT",
          ipAddress: "192.168.1.101",
          userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          details: { email: "maria@example.com", attempts: 3 }
        },
        {
          id: "3",
          level: "ERROR",
          message: "Erro ao processar pagamento",
          userId: "user789",
          userName: "Pedro Costa",
          action: "PAYMENT_ERROR",
          ipAddress: "192.168.1.102",
          userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1)",
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          details: { eventId: "event123", amount: 50.00, error: "Stripe API error" }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log =>
    log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pages = Math.ceil(filteredLogs.length / rowsPerPage);
  const items = filteredLogs.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const getLevelColor = (level: string) => {
    switch (level) {
      case "ERROR": return "danger";
      case "WARNING": return "warning";
      case "INFO": return "primary";
      case "DEBUG": return "default";
      default: return "default";
    }
  };

  const handleViewLog = (log: LogEntry) => {
    setSelectedLog(log);
    onOpen();
  };

  const handleExportLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (levelFilter !== "all") params.append('level', levelFilter);
      if (actionFilter !== "all") params.append('action', actionFilter);

      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/logs/export?${params}`, {
        headers: {
          'authorization': `Bearer ${token}`
        },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `logs-${moment().format('YYYY-MM-DD')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Erro ao exportar logs:', error);
      alert('Erro ao exportar logs');
    }
  };

  const clearLogs = async () => {
    if (confirm('Tem certeza que deseja limpar todos os logs? Esta ação não pode ser desfeita.')) {
      try {
        await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/admin/logs/clear`, {
          headers: {
            'authorization': `Bearer ${token}`
          }
        });
        fetchLogs();
        alert('Logs limpos com sucesso!');
      } catch (error) {
        console.error('Erro ao limpar logs:', error);
        alert('Erro ao limpar logs');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Logs do Sistema</h1>
        <div className="flex gap-2">
          <Button
            color="default"
            variant="light"
            startContent={<RefreshCw size={20} />}
            onPress={fetchLogs}
          >
            Atualizar
          </Button>
          <Button
            color="warning"
            variant="light"
            onPress={clearLogs}
          >
            Limpar Logs
          </Button>
          <Button
            color="primary"
            startContent={<DownloadIcon size={20} />}
            onPress={handleExportLogs}
          >
            Exportar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FilterIcon size={20} />
            Filtros
          </h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Buscar nos logs..."
              startContent={<SearchIcon size={20} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select
              label="Nível"
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
            >
              <SelectItem key="all" value="all">Todos os níveis</SelectItem>
              <SelectItem key="ERROR" value="ERROR">Erro</SelectItem>
              <SelectItem key="WARNING" value="WARNING">Aviso</SelectItem>
              <SelectItem key="INFO" value="INFO">Informação</SelectItem>
              <SelectItem key="DEBUG" value="DEBUG">Debug</SelectItem>
            </Select>
            <Select
              label="Ação"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <SelectItem key="all" value="all">Todas as ações</SelectItem>
              <SelectItem key="LOGIN" value="LOGIN">Login</SelectItem>
              <SelectItem key="LOGOUT" value="LOGOUT">Logout</SelectItem>
              <SelectItem key="CREATE_EVENT" value="CREATE_EVENT">Criar Evento</SelectItem>
              <SelectItem key="PAYMENT" value="PAYMENT">Pagamento</SelectItem>
              <SelectItem key="USER_CREATE" value="USER_CREATE">Criar Usuário</SelectItem>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Tabela de Logs */}
      <Card>
        <CardBody>
          <Table aria-label="Tabela de logs">
            <TableHeader>
              <TableColumn>TIMESTAMP</TableColumn>
              <TableColumn>NÍVEL</TableColumn>
              <TableColumn>USUÁRIO</TableColumn>
              <TableColumn>AÇÃO</TableColumn>
              <TableColumn>MENSAGEM</TableColumn>
              <TableColumn>IP</TableColumn>
              <TableColumn>AÇÕES</TableColumn>
            </TableHeader>
            <TableBody
              emptyContent={loading ? "Carregando logs..." : "Nenhum log encontrado"}
              items={items}
            >
              {(log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="text-sm">
                      <p className="font-medium">{moment(log.timestamp).format('DD/MM/YYYY')}</p>
                      <p className="text-gray-500">{moment(log.timestamp).format('HH:mm:ss')}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip color={getLevelColor(log.level)} variant="flat" size="sm">
                      {log.level}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    {log.userName ? (
                      <div>
                        <p className="font-medium">{log.userName}</p>
                        <p className="text-sm text-gray-500">{log.userId}</p>
                      </div>
                    ) : (
                      <span className="text-gray-400">Sistema</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip variant="flat" size="sm">
                      {log.action}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <p className="max-w-xs truncate">{log.message}</p>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-mono">{log.ipAddress}</span>
                  </TableCell>
                  <TableCell>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => handleViewLog(log)}
                    >
                      <EyeIcon size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {pages > 1 && (
            <div className="flex justify-center mt-4">
              <Pagination
                total={pages}
                page={page}
                onChange={setPage}
                showControls
              />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modal de Detalhes do Log */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Detalhes do Log</ModalHeader>
              <ModalBody>
                {selectedLog && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Timestamp</label>
                        <p className="text-lg">{moment(selectedLog.timestamp).format('DD/MM/YYYY HH:mm:ss')}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Nível</label>
                        <Chip color={getLevelColor(selectedLog.level)} variant="flat">
                          {selectedLog.level}
                        </Chip>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">Mensagem</label>
                      <p className="text-lg">{selectedLog.message}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Ação</label>
                        <Chip variant="flat">{selectedLog.action}</Chip>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">IP Address</label>
                        <p className="font-mono">{selectedLog.ipAddress}</p>
                      </div>
                    </div>

                    {selectedLog.userName && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Usuário</label>
                        <div>
                          <p className="font-medium">{selectedLog.userName}</p>
                          <p className="text-sm text-gray-500">{selectedLog.userId}</p>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium text-gray-500">User Agent</label>
                      <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                        {selectedLog.userAgent}
                      </p>
                    </div>

                    {selectedLog.details && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Detalhes</label>
                        <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
                          {JSON.stringify(selectedLog.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Fechar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
} 