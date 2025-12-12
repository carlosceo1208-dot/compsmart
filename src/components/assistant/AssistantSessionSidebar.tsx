import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Archive, ArchiveRestore, Trash2, MessageSquare, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Session {
  id: string;
  title: string | null;
  created_at: string;
  last_message_at: string;
  message_count: number;
  is_archived: boolean;
}

interface AssistantSessionSidebarProps {
  sessions: Session[];
  currentSessionId: string | null;
  showArchived: boolean;
  loading: boolean;
  onSelectSession: (sessionId: string) => void;
  onCreateSession: () => void;
  onArchiveSession: (sessionId: string) => void;
  onUnarchiveSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onToggleArchived: (show: boolean) => void;
}

export const AssistantSessionSidebar = ({
  sessions,
  currentSessionId,
  showArchived,
  loading,
  onSelectSession,
  onCreateSession,
  onArchiveSession,
  onUnarchiveSession,
  onDeleteSession,
  onToggleArchived,
}: AssistantSessionSidebarProps) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Sessões</CardTitle>
          <Button size="sm" onClick={onCreateSession} disabled={loading}>
            <Plus className="h-4 w-4 mr-1" />
            Nova
          </Button>
        </div>
        <div className="flex items-center space-x-2 pt-2">
          <Switch
            id="show-archived"
            checked={showArchived}
            onCheckedChange={onToggleArchived}
          />
          <Label htmlFor="show-archived" className="text-sm text-muted-foreground">
            Mostrar arquivadas
          </Label>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px]">
          <div className="px-4 pb-4 space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma sessão encontrada
              </p>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-all group",
                    currentSessionId === session.id
                      ? "bg-primary/10 border-primary"
                      : "hover:bg-accent/50 border-transparent",
                    session.is_archived && "opacity-60"
                  )}
                  onClick={() => onSelectSession(session.id)}
                >
                  <div className="flex items-start gap-1">
                    <div className="flex-1 min-w-0 max-w-[calc(100%-56px)]">
                      <p className="text-sm font-medium truncate">
                        {session.title || 'Sem título'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <MessageSquare className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs text-muted-foreground">
                          {session.message_count || 0} mensagens
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(session.last_message_at || session.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className={cn(
                      "flex flex-shrink-0 gap-0.5 transition-opacity",
                      currentSessionId === session.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}>
                      {session.is_archived ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUnarchiveSession(session.id);
                          }}
                          title="Restaurar"
                        >
                          <ArchiveRestore className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            onArchiveSession(session.id);
                          }}
                          title="Arquivar"
                        >
                          <Archive className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession(session.id);
                        }}
                        title="Excluir"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
