import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  usePerformanceKudos, 
  kudosCategoryLabels, 
  kudosCategoryEmojis,
  type KudosCategory 
} from "@/hooks/usePerformanceKudos";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyContext } from "@/contexts/CompanyContext";
import { Loader2, Send } from "lucide-react";
import { EmployeeCombobox } from "@/components/EmployeeCombobox";

interface KudosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KudosDialog({ open, onOpenChange }: KudosDialogProps) {
  const { activeCompanyId } = useCompanyContext();
  const { sendKudos } = usePerformanceKudos();

  const [formData, setFormData] = useState({
    to_employee_id: "",
    category: "excellence" as KudosCategory,
    message: "",
    is_public: true,
  });

  // Fetch employees
  const { data: employees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: ["employees-for-kudos", activeCompanyId],
    queryFn: async () => {
      if (!activeCompanyId) return [];
      
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, job_title")
        .eq("root_company_id", activeCompanyId)
        .eq("status", "active")
        .neq("id", userData.user?.id) // Exclude current user
        .order("full_name");
      if (error) throw error;
      return data;
    },
    enabled: !!activeCompanyId && open,
  });

  const selectedEmployee = employees?.find(e => e.id === formData.to_employee_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await sendKudos.mutateAsync({
      to_employee_id: formData.to_employee_id,
      category: formData.category,
      message: formData.message,
      is_public: formData.is_public,
    });

    // Reset form
    setFormData({
      to_employee_id: "",
      category: "excellence",
      message: "",
      is_public: true,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md flex flex-col max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🎉 Enviar Kudos
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            <div className="space-y-2">
              <Label>Para quem?</Label>
              <EmployeeCombobox
                employees={employees}
                value={formData.to_employee_id}
                onChange={(value) => setFormData({ ...formData, to_employee_id: value })}
                placeholder="Digite para buscar colaborador..."
              />
            </div>

            {selectedEmployee && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedEmployee.avatar_url || undefined} />
                  <AvatarFallback>
                    {selectedEmployee.full_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedEmployee.full_name}</p>
                  {selectedEmployee.job_title && (
                    <p className="text-xs text-muted-foreground">{selectedEmployee.job_title}</p>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Categoria</Label>
              <RadioGroup
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value as KudosCategory })}
                className="grid grid-cols-2 gap-2"
              >
                {Object.entries(kudosCategoryLabels).map(([value, label]) => (
                  <div key={value} className="flex items-center space-x-2">
                    <RadioGroupItem value={value} id={value} />
                    <Label htmlFor={value} className="cursor-pointer text-sm">
                      {kudosCategoryEmojis[value as KudosCategory]} {label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Mensagem *</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Escreva uma mensagem de reconhecimento..."
                rows={4}
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_public"
                checked={formData.is_public}
                onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="is_public" className="text-sm cursor-pointer">
                Visível para todos (público)
              </Label>
            </div>
          </div>

          <DialogFooter className="mt-4 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={sendKudos.isPending || !formData.to_employee_id || !formData.message}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {sendKudos.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Enviar Kudos
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
