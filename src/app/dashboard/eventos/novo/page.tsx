"use client"
import { useState, useEffect } from "react";
import { Input, Button, Select, SelectItem, Divider, Card, CardBody } from "@nextui-org/react";
import { useRouter } from "next-nprogress-bar";
import axios from "axios";
import { useAuth } from "@/context/authContext";
import EstablishmentSearch from '@/components/EstablishmentSearch';
import { ImageUpload } from '@/components/ImageUpload';
import moment from 'moment-timezone';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from "react-datepicker";
import ptBR from 'date-fns/locale/pt-BR';

// Registrar o locale português brasileiro
registerLocale('pt-BR', ptBR);

export default function NovoEventoPage() {
  const router = useRouter();
  const { user, token } = useAuth();

  // Remover o campo de endereço do form inicial
  const [form, setForm] = useState({
    name: "",
    description: "",
    dateTimestamp: null as Date | null,
    endTimestamp: null as Date | null,
    establishmentId: "",
    coordinates_event: null,
    duration: ""
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
  const [selectedEstablishment, setSelectedEstablishment] = useState<any>(null);

  // Estado para imagens
  const [eventImageFiles, setEventImageFiles] = useState<File[]>([]);

  const isPromoter = user?.type === "PROFESSIONAL_PROMOTER";
  const isOwner = user?.type === "PROFESSIONAL_OWNER";

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  const moneyMask = (value: string) => {
    let v = value.replace('.', '').replace(',', '').replace(/\D/g, '')

    const options = { minimumFractionDigits: 2 }
    const result = new Intl.NumberFormat('pt-BR', options).format(
      parseFloat(v) / 100
    )

    setTicketForm(prev => ({ ...prev, price: result }))
  }

  const addTicket = () => {
    if (!ticketForm.category || !ticketForm.price || !ticketForm.quantity) return;
    setTickets([...tickets, {
      category: ticketForm.category,
      price: Number(String(ticketForm.price).replace("R$", '').replaceAll('.', '').replace(',', '.')),
      quantity: Number(ticketForm.quantity)
    }]);
    setTicketForm({ category: "", price: "", quantity: "" });
  };

  const removeTicket = (idx: number) => {
    setTickets(tickets.filter((_, i) => i !== idx));
  };

  // Atualizar o form ao selecionar estabelecimento
  const handleEstablishmentSelect = (establishment: any) => {
    setSelectedEstablishment(establishment);
    setForm({
      ...form,
      establishmentId: establishment?.id || "",
    });
  };

  const handleImagesChanged = (imageFiles: File[]) => {
    setEventImageFiles(imageFiles);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    
    // Validações específicas por tipo de usuário
    if (!form.name || !form.description || !form.dateTimestamp) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }

    // Validar se a data não é passada
    const eventDate = form.dateTimestamp;
    const now = new Date();
    
    if (!eventDate) {
      setError("Selecione uma data e hora para o evento.");
      return;
    }
    
    // Adicionar margem de 1 hora para evitar eventos muito próximos
    const minimumDate = new Date(now.getTime() + 60 * 60 * 1000); // 1 hora a partir de agora
    
    if (eventDate <= minimumDate) {
      setError("O evento deve ser criado com pelo menos 1 hora de antecedência.");
      return;
    }

    // Validar se endTimestamp é posterior a dateTimestamp
    if (form.endTimestamp) {
      const eventEndDate = form.endTimestamp;
      if (eventEndDate <= eventDate) {
        setError("O horário de término deve ser posterior ao horário de início.");
        return;
      }
    }

    if (isPromoter && !form.establishmentId) {
      setError("Selecione um estabelecimento.");
      return;
    }

    if (isPromoter && !selectedEstablishment) {
      setError("Selecione um estabelecimento.");
      return;
    }

    setError(null);
    setSuccess(null);
    
    try {
      // Fazer upload das imagens primeiro
      const uploadedImageUrls: string[] = [];
      
      if (eventImageFiles.length > 0) {
        setSuccess("Fazendo upload das imagens...");
        
        for (const file of eventImageFiles) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('folder', 'events');
          
          const uploadUrl = process.env.NEXT_PUBLIC_IMAGE_UPLOAD_URL || '/api/upload';
          const uploadResponse = await fetch(uploadUrl, {
            method: 'POST',
            body: formData,
          });
          
          if (uploadResponse.ok) {
            const result = await uploadResponse.json();
            uploadedImageUrls.push(result.url);
          } else {
            throw new Error(`Erro ao fazer upload da imagem: ${uploadResponse.status}`);
          }
        }
      }

      // O DatePicker retorna a data no fuso horário local do usuário
      // Vamos enviar a data como string ISO sem conversão de fuso horário
      const dateTimestampUTC = form.dateTimestamp?.toISOString() || '';
      
      const duration = Number(form.duration);
      const endDateObj = new Date(form.dateTimestamp!.getTime() + duration * 60 * 60 * 1000);
      const endTimestampUTC = endDateObj.toISOString();
      
      // Preparar dados baseados no tipo de usuário
      const eventData = {
        ...form,
        dateTimestamp: dateTimestampUTC,
        endTimestamp: endTimestampUTC,
        tickets,
        photos: uploadedImageUrls, // URLs das imagens enviadas
        establishmentId: isOwner ? user?.establishment?.id ?? '' : form.establishmentId,
        address: isOwner ? null : selectedEstablishment?.address,
        coordinates_event: isOwner ? null : form.coordinates_event
      };

      const response = await axios.post("/api/event/create", eventData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data && (response.data.success || response.data.event)) {
        setSuccess("Evento criado com sucesso!");
        
        // Limpar formulário
        setForm({
          name: "",
          description: "",
          dateTimestamp: null,
          endTimestamp: null,
          establishmentId: "",
          coordinates_event: null,
          duration: ""
        });
        setTickets([]);
        setSelectedEstablishment(null);
        setEventImageFiles([]); // Limpar arquivos de imagem
        
        // Redirecionar após 2 segundos
        setTimeout(() => {
          // Promoters vão para eventos pendentes, owners para eventos
          const redirectPath = isPromoter ? "/dashboard/eventos/pendentes" : "/dashboard/eventos";
          router.push(redirectPath);
        }, 2000);
      } else {
        setError(response.data?.message || response.data?.error || "Erro ao criar evento.");
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Erro ao criar evento."
      );
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Criar Novo Evento</h1>
      {error && <div className="mb-4 text-red-500 font-medium bg-red-50 border border-red-200 rounded p-2">{error}</div>}
      {success && <div className="mb-4 text-green-600 font-medium bg-green-50 border border-green-200 rounded p-2">{success}</div>}
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
        <div>
          <DatePicker
            selected={form.dateTimestamp}
            onChange={date => setForm(prev => ({ ...prev, dateTimestamp: date }))}
            showTimeSelect
            timeFormat="HH:mm"
            timeIntervals={15}
            dateFormat="dd/MM/yyyy HH:mm"
            placeholderText="Selecione a data e hora"
            className="w-full px-4 py-3 rounded-md border border-default-200 text-theme-primary bg-white shadow-sm focus:ring-2 focus:ring-accent-primary"
            timeZone="America/Sao_Paulo"
            locale="pt-BR"
            minDate={new Date(Date.now() + 60 * 60 * 1000)} // Mínimo 1 hora a partir de agora
            filterTime={(time) => {
              const now = new Date();
              const selectedDate = new Date(time);
              const minimumTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hora a partir de agora
              return selectedDate > minimumTime;
            }}
          />
          <p className="text-xs text-gray-500 mt-1">
            ⏰ O evento deve ser criado com pelo menos 1 hora de antecedência
          </p>
        </div>
        {/* Substituir campo de data de término por duração */}
        <Input
          type="number"
          label="Duração do evento (horas)"
          name="duration"
          value={form.duration || ''}
          onChange={e => setForm(prev => ({ ...prev, duration: e.target.value }))}
          min={1}
          placeholder="Ex: 5"
          isRequired
        />

        <div>
          <label className="text-sm font-medium text-theme-tertiary mb-2 block">
            Imagens do Evento
          </label>
          <ImageUpload
            onImagesChanged={handleImagesChanged}
            folder="events"
            maxImages={5}
          />
        </div>
        {/* Campo de estabelecimento apenas para promoters */}
        {isPromoter && (
          <div>
            <EstablishmentSearch
              onEstablishmentSelect={handleEstablishmentSelect}
              selectedEstablishment={selectedEstablishment}
            />
            {selectedEstablishment && (
              <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded">
                <div className="text-xs text-gray-600">
                  <strong>Endereço:</strong> {selectedEstablishment.address}
                </div>
              </div>
            )}
          </div>
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
            onChange={({ target: { value } }) => {
              moneyMask(value)
            }}
            placeholder="R$ 100,00"
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