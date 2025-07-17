"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Input, Button, Spinner } from "@nextui-org/react";
import GoogleAutocomplete from "@/components/GoogleAutocomplete";
import axios from "axios";
import { useAuth } from "@/context/authContext";

export default function EditarUsuarioPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [form, setForm] = useState({
    establishmentName: "",
    establishmentAddress: "",
    coordinates: null as { latitude: number; longitude: number } | null
  });

  // Buscar dados do usuário
  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Token de autenticação não encontrado. Faça login novamente.');
        setLoading(false);
        return;
      }
      try {
        const resp = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/admin/users/professionals-detailed`,
          {
            headers: {
              'authorization': `Bearer ${token}`
            }
          }
        );
        const found = resp.data.professionals.find((p: any) => p.user.id === userId || p.user.uid === userId);
        if (!found) throw new Error("Usuário não encontrado");
        setUser(found.user);
        setForm({
          establishmentName: found.establishment?.name || "",
          establishmentAddress: found.establishment?.address || "",
          coordinates: found.establishment?.coordinates
            ? (found.establishment.coordinates.lat !== undefined
                ? { latitude: found.establishment.coordinates.lat, longitude: found.establishment.coordinates.lng }
                : found.establishment.coordinates)
            : null
        });
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || "Erro ao buscar usuário");
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [userId]);

  async function handleSave() {
    if (!user || !form.establishmentName.trim() || !form.establishmentAddress.trim() || !form.coordinates) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }
    setSaving(true);
    setError(null);
    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('Token de autenticação não encontrado. Faça login novamente.');
      setSaving(false);
      return;
    }
    try {
      const resp = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/users/professionals-detailed`,
        {
          headers: {
            'authorization': `Bearer ${token}`
          }
        }
      );
      const found = resp.data.professionals.find((p: any) => p.user.id === userId || p.user.uid === userId);
      if (!found || !found.establishment) throw new Error("Estabelecimento não encontrado");
      const estId = found.establishment.id;
      await axios.put(
        `/api/establishment/admin/update/${estId}`,
        {
          name: form.establishmentName.trim(),
          address: form.establishmentAddress.trim(),
          coordinates: form.coordinates
        },
        {
          headers: {
            'authorization': `Bearer ${token}`
          }
        }
      );
      router.push("/dashboard/master/usuarios");
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Erro ao salvar alterações");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Editar Estabelecimento</h1>
      <div className="space-y-4">
        <Input
          label="Nome do Estabelecimento"
          value={form.establishmentName}
          onChange={e => setForm(f => ({ ...f, establishmentName: e.target.value }))}
        />
        <GoogleAutocomplete
          label="Endereço"
          value={form.establishmentAddress}
          onChange={(address, coordinates) => setForm(f => ({
            ...f,
            establishmentAddress: address,
            coordinates: coordinates
              ? { latitude: coordinates.lat, longitude: coordinates.lng }
              : null
          }))}
          placeholder="Digite o endereço do estabelecimento..."
        />
        {form.coordinates ? (
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            <strong>Coordenadas detectadas:</strong><br />
            Latitude: {typeof form.coordinates.latitude === 'number' ? form.coordinates.latitude.toFixed(6) : 'N/A'}<br />
            Longitude: {typeof form.coordinates.longitude === 'number' ? form.coordinates.longitude.toFixed(6) : 'N/A'}
          </div>
        ) : (
          <div className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg">
            <strong>Coordenadas não detectadas para este endereço.</strong><br />
            Tente selecionar outra sugestão ou digite um endereço mais específico.
          </div>
        )}
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <div className="flex gap-2 justify-end mt-4">
          <Button color="danger" variant="flat" onPress={() => router.push("/dashboard/master/usuarios")}>Cancelar</Button>
          <Button color="primary" isLoading={saving} onPress={handleSave}>Salvar</Button>
        </div>
      </div>
    </div>
  );
} 