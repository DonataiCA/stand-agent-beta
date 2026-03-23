import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import type { Lead } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Sparkles, Save, Mic, MessageSquare } from 'lucide-react';

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Lead>>({});

  useEffect(() => {
    async function fetchLead() {
      try {
        const { data } = await api.get<Lead>(`/leads/${id}`);
        setLead(data);
        setForm(data);
      } catch { console.error('Error fetching lead'); }
      finally { setLoading(false); }
    }
    fetchLead();
  }, [id]);

  async function handleEnrich() {
    if (!lead) return;
    setEnriching(true);
    try {
      const { data } = await api.patch(`/leads/${lead.id}/enrich`, {
        additionalNotes: 'Enriched from dashboard',
      });
      setLead(data);
      setForm(data);
    } catch (err) { console.error('Error enriching:', err); }
    finally { setEnriching(false); }
  }

  async function handleSave() {
    if (!lead) return;
    try {
      const { data } = await api.put(`/leads/${lead.id}`, {
        name: form.name,
        company: form.company,
        role: form.role,
        email: form.email,
        phone: form.phone,
        businessAngle: form.businessAngle,
        notes: form.notes,
      });
      setLead(data);
      setForm(data);
      setEditing(false);
    } catch (err) { console.error('Error saving:', err); }
  }

  if (loading) return <div className="text-center py-12 text-muted-foreground">Cargando...</div>;
  if (!lead) return <div className="text-center py-12 text-muted-foreground">Lead no encontrado</div>;

  const fields: { key: keyof Lead; label: string }[] = [
    { key: 'name', label: 'Nombre' },
    { key: 'company', label: 'Empresa' },
    { key: 'role', label: 'Cargo' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Teléfono' },
    { key: 'businessAngle', label: 'Ángulo de negocio' },
    { key: 'notes', label: 'Notas' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{lead.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            {lead.company && <span className="text-muted-foreground">{lead.company}</span>}
            <Badge variant={lead.source === 'AUDIO' ? 'secondary' : 'outline'} className="text-xs">
              {lead.source === 'AUDIO' ? <Mic className="h-3 w-3 mr-1" /> : <MessageSquare className="h-3 w-3 mr-1" />}
              {lead.source || 'TEXT'}
            </Badge>
            {lead.companyType && <Badge variant="outline" className="text-xs">{lead.companyType}</Badge>}
          </div>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <Button onClick={handleSave} size="sm"><Save className="h-4 w-4 mr-1" /> Guardar</Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Editar</Button>
          )}
          <Button variant="secondary" size="sm" onClick={handleEnrich} disabled={enriching}>
            <Sparkles className="h-4 w-4 mr-1" /> {enriching ? 'Enriqueciendo...' : 'Enriquecer'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-lg">Información del contacto</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {fields.map(({ key, label }) => (
              <div key={key} className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">{label}</Label>
                {editing ? (
                  <Input
                    value={(form[key] as string) || ''}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value || null })}
                  />
                ) : (
                  <p className="text-sm">{(lead[key] as string) || <span className="text-muted-foreground italic">Sin datos</span>}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Metadata</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">ID</Label>
              <p className="text-sm font-mono text-muted-foreground">{lead.id}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">LinkedIn</Label>
              <p className="text-sm">{lead.linkedinUrl || <span className="text-muted-foreground italic">Sin datos</span>}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Website</Label>
              <p className="text-sm">{lead.websiteUrl || <span className="text-muted-foreground italic">Sin datos</span>}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Creado</Label>
              <p className="text-sm">{new Date(lead.createdAt).toLocaleString('es-ES')}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Actualizado</Label>
              <p className="text-sm">{new Date(lead.updatedAt).toLocaleString('es-ES')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
