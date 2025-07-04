"use client"
import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader, Button, Input, Switch, Textarea, Divider, Chip } from "@nextui-org/react";
import { SaveIcon, RotateCcw, ShieldIcon, BellIcon, CreditCardIcon, DatabaseIcon } from "lucide-react";
import { useAuth } from "@/context/authContext";
import axios from "axios";

interface SystemConfig {
  systemName: string;
  systemDescription: string;
  maintenanceMode: boolean;
  allowNewRegistrations: boolean;
  requireEmailVerification: boolean;
  maxFileSize: number;
  allowedFileTypes: string[];
  emailSettings: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
  };
  paymentSettings: {
    stripeEnabled: boolean;
    stripePublicKey: string;
    stripeSecretKey: string;
    pixEnabled: boolean;
  };
  notificationSettings: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
  };
}

export default function ConfiguracoesMasterPage() {
  const { user, token } = useAuth();
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    if (token) {
      fetchConfig();
    }
  }, [token]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/config`, {
        headers: {
          'authorization': `Bearer ${token}`
        }
      });
      setConfig(response.data);
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      // Configuração padrão caso a API não esteja disponível
      setConfig({
        systemName: "Lets Go",
        systemDescription: "Sistema de venda de ingressos para eventos",
        maintenanceMode: false,
        allowNewRegistrations: true,
        requireEmailVerification: true,
        maxFileSize: 5242880, // 5MB
        allowedFileTypes: ["jpg", "jpeg", "png", "gif"],
        emailSettings: {
          smtpHost: "",
          smtpPort: 587,
          smtpUser: "",
          smtpPassword: ""
        },
        paymentSettings: {
          stripeEnabled: false,
          stripePublicKey: "",
          stripeSecretKey: "",
          pixEnabled: true
        },
        notificationSettings: {
          emailNotifications: true,
          pushNotifications: true,
          smsNotifications: false
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!config) return;
    
    try {
      setSaving(true);
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/admin/config`, config, {
        headers: {
          'authorization': `Bearer ${token}`
        }
      });
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleResetConfig = async () => {
    if (confirm('Tem certeza que deseja redefinir todas as configurações?')) {
      await fetchConfig();
    }
  };

  const updateConfig = (path: string, value: any) => {
    if (!config) return;
    
    const keys = path.split('.');
    const newConfig = { ...config };
    let current: any = newConfig;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setConfig(newConfig);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 bg-theme-secondary">
        <div className="text-lg text-theme-primary">Carregando configurações...</div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex justify-center items-center h-64 bg-theme-secondary">
        <div className="text-lg text-red-500">Erro ao carregar configurações</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-theme-secondary min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-theme-primary">Configurações do Sistema</h1>
        <div className="flex gap-2">
          <Button
            color="default"
            variant="light"
            className="border-theme-primary text-theme-primary"
            startContent={<RotateCcw size={20} />}
            onPress={handleResetConfig}
          >
            Redefinir
          </Button>
          <Button
            color="primary"
            className="bg-accent-primary text-theme-primary border-theme-primary"
            startContent={<SaveIcon size={20} />}
            onPress={handleSaveConfig}
            isLoading={saving}
          >
            Salvar Configurações
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-theme-tertiary p-1 rounded-lg">
        <Button
          variant={activeTab === "general" ? "solid" : "light"}
          size="sm"
          className={activeTab === "general" ? "bg-accent-primary text-theme-primary" : "text-theme-primary"}
          onPress={() => setActiveTab("general")}
        >
          Geral
        </Button>
        <Button
          variant={activeTab === "email" ? "solid" : "light"}
          size="sm"
          className={activeTab === "email" ? "bg-accent-primary text-theme-primary" : "text-theme-primary"}
          onPress={() => setActiveTab("email")}
        >
          Email
        </Button>
        <Button
          variant={activeTab === "payment" ? "solid" : "light"}
          size="sm"
          className={activeTab === "payment" ? "bg-accent-primary text-theme-primary" : "text-theme-primary"}
          onPress={() => setActiveTab("payment")}
        >
          Pagamentos
        </Button>
        <Button
          variant={activeTab === "notifications" ? "solid" : "light"}
          size="sm"
          className={activeTab === "notifications" ? "bg-accent-primary text-theme-primary" : "text-theme-primary"}
          onPress={() => setActiveTab("notifications")}
        >
          Notificações
        </Button>
      </div>

      {/* Configurações Gerais */}
      {activeTab === "general" && (
        <Card className="bg-theme-secondary border border-theme-primary">
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center gap-2 text-theme-primary">
              <ShieldIcon size={20} />
              Configurações Gerais
            </h3>
          </CardHeader>
          <CardBody className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Nome do Sistema"
                value={config.systemName}
                onChange={(e) => updateConfig('systemName', e.target.value)}
                placeholder="Lets Go"
                className="input-theme"
              />
              <Input
                label="Tamanho Máximo de Arquivo (MB)"
                type="number"
                value={String(config.maxFileSize / 1024 / 1024)}
                onChange={(e) => updateConfig('maxFileSize', parseInt(e.target.value) * 1024 * 1024)}
                className="input-theme"
              />
            </div>

            <Textarea
              label="Descrição do Sistema"
              value={config.systemDescription}
              onChange={(e) => updateConfig('systemDescription', e.target.value)}
              placeholder="Descrição do sistema..."
              className="input-theme"
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-theme-primary">Modo de Manutenção</p>
                  <p className="text-sm text-theme-tertiary">Desabilita o acesso ao sistema para usuários comuns</p>
                </div>
                <Switch
                  isSelected={config.maintenanceMode}
                  onValueChange={(value) => updateConfig('maintenanceMode', value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-theme-primary">Permitir Novos Registros</p>
                  <p className="text-sm text-theme-tertiary">Permite que novos usuários se registrem</p>
                </div>
                <Switch
                  isSelected={config.allowNewRegistrations}
                  onValueChange={(value) => updateConfig('allowNewRegistrations', value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-theme-primary">Verificação de Email Obrigatória</p>
                  <p className="text-sm text-theme-tertiary">Exige verificação de email para novos usuários</p>
                </div>
                <Switch
                  isSelected={config.requireEmailVerification}
                  onValueChange={(value) => updateConfig('requireEmailVerification', value)}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-theme-primary">Tipos de Arquivo Permitidos</label>
              <div className="flex gap-2 mt-2">
                {config.allowedFileTypes.map((type, index) => (
                  <Chip key={index} variant="flat" color="primary" className="bg-accent-primary text-theme-primary">
                    {type}
                  </Chip>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Configurações de Email */}
      {activeTab === "email" && (
        <Card className="bg-theme-secondary border border-theme-primary">
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center gap-2 text-theme-primary">
              <DatabaseIcon size={20} />
              Configurações de Email
            </h3>
          </CardHeader>
          <CardBody className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Servidor SMTP"
                value={config.emailSettings.smtpHost}
                onChange={(e) => updateConfig('emailSettings.smtpHost', e.target.value)}
                placeholder="smtp.gmail.com"
                className="input-theme"
              />
              <Input
                label="Porta SMTP"
                type="number"
                value={String(config.emailSettings.smtpPort)}
                onChange={(e) => updateConfig('emailSettings.smtpPort', parseInt(e.target.value))}
                placeholder="587"
                className="input-theme"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Usuário SMTP"
                value={config.emailSettings.smtpUser}
                onChange={(e) => updateConfig('emailSettings.smtpUser', e.target.value)}
                placeholder="seu-email@gmail.com"
                className="input-theme"
              />
              <Input
                label="Senha SMTP"
                type="password"
                value={config.emailSettings.smtpPassword}
                onChange={(e) => updateConfig('emailSettings.smtpPassword', e.target.value)}
                placeholder="Sua senha"
                className="input-theme"
              />
            </div>

            <div className="bg-theme-tertiary p-4 rounded-lg">
              <p className="text-sm text-theme-tertiary">
                <strong>Nota:</strong> Para Gmail, você pode precisar usar uma "Senha de App" em vez da senha normal da conta.
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Configurações de Pagamento */}
      {activeTab === "payment" && (
        <Card className="bg-theme-secondary border border-theme-primary">
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center gap-2 text-theme-primary">
              <CreditCardIcon size={20} />
              Configurações de Pagamento
            </h3>
          </CardHeader>
          <CardBody className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-theme-primary">Stripe Habilitado</p>
                  <p className="text-sm text-theme-tertiary">Permite pagamentos via cartão de crédito</p>
                </div>
                <Switch
                  isSelected={config.paymentSettings.stripeEnabled}
                  onValueChange={(value) => updateConfig('paymentSettings.stripeEnabled', value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-theme-primary">PIX Habilitado</p>
                  <p className="text-sm text-theme-tertiary">Permite pagamentos via PIX</p>
                </div>
                <Switch
                  isSelected={config.paymentSettings.pixEnabled}
                  onValueChange={(value) => updateConfig('paymentSettings.pixEnabled', value)}
                />
              </div>
            </div>

            {config.paymentSettings.stripeEnabled && (
              <>
                <Divider className="border-theme-primary" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Chave Pública do Stripe"
                    value={config.paymentSettings.stripePublicKey}
                    onChange={(e) => updateConfig('paymentSettings.stripePublicKey', e.target.value)}
                    placeholder="pk_test_..."
                    className="input-theme"
                  />
                  <Input
                    label="Chave Secreta do Stripe"
                    type="password"
                    value={config.paymentSettings.stripeSecretKey}
                    onChange={(e) => updateConfig('paymentSettings.stripeSecretKey', e.target.value)}
                    placeholder="sk_test_..."
                    className="input-theme"
                  />
                </div>
              </>
            )}
          </CardBody>
        </Card>
      )}

      {/* Configurações de Notificação */}
      {activeTab === "notifications" && (
        <Card className="bg-theme-secondary border border-theme-primary">
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center gap-2 text-theme-primary">
              <BellIcon size={20} />
              Configurações de Notificação
            </h3>
          </CardHeader>
          <CardBody className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-theme-primary">Notificações por Email</p>
                  <p className="text-sm text-theme-tertiary">Envia notificações por email</p>
                </div>
                <Switch
                  isSelected={config.notificationSettings.emailNotifications}
                  onValueChange={(value) => updateConfig('notificationSettings.emailNotifications', value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-theme-primary">Notificações Push</p>
                  <p className="text-sm text-theme-tertiary">Envia notificações push para o app móvel</p>
                </div>
                <Switch
                  isSelected={config.notificationSettings.pushNotifications}
                  onValueChange={(value) => updateConfig('notificationSettings.pushNotifications', value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-theme-primary">Notificações SMS</p>
                  <p className="text-sm text-theme-tertiary">Envia notificações por SMS</p>
                </div>
                <Switch
                  isSelected={config.notificationSettings.smsNotifications}
                  onValueChange={(value) => updateConfig('notificationSettings.smsNotifications', value)}
                />
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
} 