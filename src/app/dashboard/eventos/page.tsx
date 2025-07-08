"use client";
import { useEffect, useState } from "react";
import { ListEvents } from "@/components/Event";
import { Event } from "@/types/Letsgo";
import { useAuth } from "@/context/authContext";
import axios from "axios";

export default function EventosPage() {
  const { user, token } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      let response;
      
      if (user?.type === "PROFESSIONAL_PROMOTER") {
        // Promoters veem apenas eventos aprovados
        response = await axios.get(`/api/event/find-many-by-user-approved`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      } else {
        // Owners veem apenas eventos aprovados do estabelecimento
        if (!user?.establishment?.id) {
          setLoading(false);
          return;
        }
        response = await axios.get(`/api/event/find-many-by-establishment-approved/${user.establishment.id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }
      
      setEvents(Array.isArray(response.data.events) ? response.data.events : []);
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    fetchEvents();
  }, [token, user]);

  if (loading) {
    return <div className="p-8 text-center">Carregando eventos...</div>;
  }

  return (
    <main className="w-full max-w-6xl mx-auto px-6 py-8">
      <ListEvents events={events} onEventsUpdate={fetchEvents} />
    </main>
  );
}