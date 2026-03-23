import { useState, type FormEvent } from 'react';
import api from '@/lib/api';
import type { RagResponse } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Sparkles, User } from 'lucide-react';

export default function RagSearchPage() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<RagResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const { data } = await api.post<RagResponse>('/rag/query', { query, limit: 5 });
      setResult(data);
    } catch (err) {
      setError('Error al consultar. Verifica que el backend esté corriendo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">RAG Search</h1>
        <p className="text-muted-foreground text-sm">Pregunta sobre tus leads usando lenguaje natural</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="¿Quién trabaja en IA? ¿Cuál lead tiene mayor presupuesto? ..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={loading || !query.trim()}>
              <Sparkles className="h-4 w-4 mr-1" />
              {loading ? 'Buscando...' : 'Consultar'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && <p className="text-destructive text-sm">{error}</p>}

      {result && (
        <div className="space-y-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Respuesta IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{result.answer}</p>
            </CardContent>
          </Card>

          {result.sources && result.sources.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Leads fuente ({result.sources.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.sources.map((lead) => (
                  <Card key={lead.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-secondary/10 rounded-full p-2">
                          <User className="h-4 w-4 text-secondary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{lead.name}</p>
                          <p className="text-xs text-muted-foreground">{lead.company || 'Sin empresa'} {lead.role ? `— ${lead.role}` : ''}</p>
                          {lead.businessAngle && <p className="text-xs mt-1 text-muted-foreground line-clamp-2">{lead.businessAngle}</p>}
                          <div className="flex gap-1 mt-2">
                            {lead.companyType && <Badge variant="outline" className="text-xs">{lead.companyType}</Badge>}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
