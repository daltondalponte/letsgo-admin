"use client"
import { useState, useEffect } from "react";
import { Input, Button, Select, SelectItem, Divider, Card, CardBody } from "@nextui-org/react";
import { useRouter } from "next-nprogress-bar";
import axios from "axios";
import { useAuth } from "@/context/authContext";

export default function NovoEventoPage() {
  const router = useRouter();
  const { user, token } = useAuth();

  // Formulário do evento
  const [form, setForm] = useState({
    name: "",
    description: "",
    dateTimestamp: "",
    establishmentId: "",
    address: "",
    coordinates_event: null,
  });

  // Tickets
  const [tickets, setTickets] = useState<any[]>([]);
  const [ticketForm, setTicketForm] = useState({
    category: "",
    price: "",
    quantity: ""
  });

  // Estados para estabelecimentos (para promoter)
  const [establishments, setEstablishments] = useState<any[]>([]);
  const [loadingEstablishments, setLoadingEstablishments] = useState(false);

  const isPromoter = user?.type === "PROFESSIONAL_PROMOTER";
  const isOwner = user?.type === "PROFESSIONAL_OWNER";

  const [error, setError] = useState<string | null>(null);

  // Buscar estabelecimentos disponíveis para promoters
  useEffect(() => {
    if (isPromoter) {
      fetchEstablishments();
    }
  }, [isPromoter]);

  const fetchEstablishments = async () => {
    setLoadingEstablishments(true);
    try {
      const response = await axios.get("/api/establishment/available-for-promoters", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setEstablishments(response.data.establishments || []);
    } catch (err) {
      console.error("Erro ao buscar estabelecimentos:", err);
      setError("Erro ao carregar estabelecimentos disponíveis.");
    } finally {
      setLoadingEstablishments(false);
    }
  };

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleTicketChange = (e: any) => {
    setTicketForm({ ...ticketForm, [e.target.name]: e.target.value });
  };

  const addTicket = () => {
    if (!ticketForm.category || !ticketForm.price || !ticketForm.quantity) return;
    setTickets([...tickets, ticketForm]);
    setTicketForm({ category: "", price: "", quantity: "" });
  };

  const removeTicket = (idx: number) => {
    setTickets(tickets.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    
    // Validações específicas por tipo de usuário
    if (!form.name || !form.description || !form.dateTimestamp) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }

    if (isPromoter && !form.establishmentId) {
      setError("Selecione um estabelecimento.");
      return;
    }

    if (isPromoter && !form.address) {
      setError("Digite o endereço do evento.");
      return;
    }

    setError(null);
    try {
      // Converter a data para formato ISO-8601
      const dateTimestamp = new Date(form.dateTimestamp).toISOString();
      
      // Preparar dados baseados no tipo de usuário
      console.log('USER:', user);
      const eventData = {
        ...form,
        dateTimestamp,
        tickets,
        establishmentId: isOwner ? user?.establishment?.id ?? '' : form.establishmentId,
        address: isOwner ? null : form.address,
        coordinates_event: isOwner ? null : form.coordinates_event
      };

      console.log('TOKEN ENVIADO NA CRIAÇÃO DE EVENTO:', token);

      const response = await axios.post("/api/event/create", eventData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data && (response.data.success || response.data.event)) {
        router.push("/dashboard/eventos");
      } else {
        setError(response.data?.message || response.data?.error || "Erro ao criar evento.");
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || "Erro ao criar evento.");
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Criar Novo Evento</h1>
      {error && <div className="mb-4 text-red-500 font-medium bg-red-50 border border-red-200 rounded p-2">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Nome do Evento"
          name="name"
          value={form.name}
          onChange={handleChange}
          isRequired
        />
        <label className="text-sm font-medium text-theme-tertiary mb-1">Descrição</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={5}
          className="w-full px-4 py-3 rounded-md border border-default-200 text-theme-primary bg-white shadow-sm focus:ring-2 focus:ring-accent-primary resize-y min-h-[100px]"
          required
        />
        <Input
          type="datetime-local"
          label="Data e Hora"
          name="dateTimestamp"
          value={form.dateTimestamp}
          onChange={handleChange}
          placeholder="Selecione a data e hora"
          isRequired
        />
        
        {/* Campo de endereço apenas para promoters */}
        {isPromoter && (
          <Input
            label="Endereço do Evento"
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Digite o endereço do evento"
            isRequired
          />
        )}

        {/* Campo de estabelecimento apenas para promoters */}
        {isPromoter && (
          <Select
            label="Estabelecimento"
            placeholder={loadingEstablishments ? "Carregando..." : "Selecione o estabelecimento"}
            selectedKeys={form.establishmentId ? [form.establishmentId] : []}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as string;
              setForm({ ...form, establishmentId: selected });
            }}
            isRequired
            isDisabled={loadingEstablishments}
          >
            {establishments.map((est) => (
              <SelectItem key={est.id} value={est.id}>{est.name}</SelectItem>
            ))}
          </Select>
        )}

        {/* Informação para owners */}
        {isOwner && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-blue-800 text-sm">
              <strong>Informação:</strong> O evento será realizado no seu próprio estabelecimento.
            </p>
          </div>
        )}

        <Divider className="my-4" />
        <h2 className="text-lg font-bold mb-2">Ingressos</h2>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <Input
            label="Categoria"
            name="category"
            value={ticketForm.category}
            onChange={handleTicketChange}
          />
          <Input
            label="Preço"
            name="price"
            value={ticketForm.price}
            onChange={handleTicketChange}
            type="number"
            min={0}
          />
          <Input
            label="Quantidade"
            name="quantity"
            value={ticketForm.quantity}
            onChange={handleTicketChange}
            type="number"
            min={1}
          />
          <Button type="button" onPress={addTicket} className="bg-[#FF6600] text-white font-bold h-10 px-3 text-xs rounded-md">Adicionar</Button>
        </div>
        <div className="space-y-2 mt-2">
          {tickets.map((ticket, idx) => (
            <Card key={idx} className="bg-content2">
              <CardBody className="flex flex-row items-center justify-between gap-4 py-2">
                <div>
                  <span className="font-medium">{ticket.category}</span> - R$ {ticket.price} ({ticket.quantity} unid.)
                </div>
                <Button size="sm" color="danger" variant="light" onPress={() => removeTicket(idx)}>Remover</Button>
              </CardBody>
            </Card>
          ))}
        </div>
        <Divider className="my-4" />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="light" onPress={() => router.push("/dashboard/eventos")}>Cancelar</Button>
          <Button type="submit" className="bg-[#FF6600] text-white font-bold">Criar Evento</Button>
        </div>
      </form>
    </div>
  );
} 