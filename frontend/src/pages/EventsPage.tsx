import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { Event } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Mic, MessageSquare, Building } from 'lucide-react';

interface EventStats {
  totalLeads: number;
  bySource: { TEXT: number; AUDIO: number; PHOTO: number };
  byCompanyType: Record<string, number>;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const { data } = await api.get('/events');
        const eventList = data.data || data;
        setEvents(eventList);
        if (eventList.length > 0) setSelectedEvent(eventList[0].id);
      } catch (err) { console.error('Error fetching events:', err); }
      finally { setLoading(false); }
    }
    fetchEvents();
  }, []);

  useEffect(() => {
    if (!selectedEvent) return;
    async function fetchStats() {
      try {
        const { data } = await api.get(`/events/${selectedEvent}/stats`);
        setStats(data);
      } catch (err) { console.error('Error fetching stats:', err); }
    }
    fetchStats();
  }, [selectedEvent]);

  if (loading) return <div className="text-center py-12 text-muted-foreground">Cargando...</div>;

  const selected = events.find(e => e.id === selectedEvent);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Eventos</h1>
        <p className="text-muted-foreground text-sm">{events.length} eventos registrados</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {events.map((event) => (
          <Card
            key={event.id}
            className={`cursor-pointer transition-all ${selectedEvent === event.id ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'}`}
            onClick={() => setSelectedEvent(event.id)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">{event.name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{event.location || 'Sin ubicación'}</p>
              {event.startDate && (
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(event.startDate).toLocaleDateString('es-ES')}
                  {event.endDate && ` — ${new Date(event.endDate).toLocaleDateString('es-ES')}`}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {stats && selected && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Stats — {selected.name}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 rounded-lg p-2"><Users className="h-5 w-5 text-primary" /></div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalLeads}</p>
                    <p className="text-xs text-muted-foreground">Total leads</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="bg-secondary/10 rounded-lg p-2"><MessageSquare className="h-5 w-5 text-secondary" /></div>
                  <div>
                    <p className="text-2xl font-bold">{stats.bySource?.TEXT || 0}</p>
                    <p className="text-xs text-muted-foreground">Por texto</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="bg-secondary/10 rounded-lg p-2"><Mic className="h-5 w-5 text-secondary" /></div>
                  <div>
                    <p className="text-2xl font-bold">{stats.bySource?.AUDIO || 0}</p>
                    <p className="text-xs text-muted-foreground">Por audio</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 rounded-lg p-2"><Building className="h-5 w-5 text-primary" /></div>
                  <div>
                    <p className="text-2xl font-bold">{Object.keys(stats.byCompanyType || {}).length}</p>
                    <p className="text-xs text-muted-foreground">Tipos empresa</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {stats.byCompanyType && Object.keys(stats.byCompanyType).length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Distribución por tipo de empresa</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(stats.byCompanyType).map(([type, count]) => (
                    <Badge key={type} variant="outline" className="text-sm px-3 py-1">
                      {type}: {count}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
