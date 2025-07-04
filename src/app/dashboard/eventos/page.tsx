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

  useEffect(() => {
    if (!token || !user?.establishment?.id) {
      setLoading(false);
      return;
    }
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/event/find-many-by-establishment/${user.establishment.id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setEvents(Array.isArray(response.data.events) ? response.data.events : []);
      } catch (error) {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [token, user]);

  if (loading) {
    return <div className="p-8 text-center">Carregando eventos...</div>;
  }

  return (
    <main className="w-full max-w-6xl mx-auto px-6 py-8">
      <ListEvents events={events} />
    </main>
  );
}