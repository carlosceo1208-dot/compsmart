import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface JobFamily {
  id: string;
  name: string;
  description: string | null;
  color_class: string | null;
  is_active: boolean;
}

interface JobFamilyManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_COLORS = [
  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
];

export function JobFamilyManager({ open, onOpenChange }: JobFamilyManagerProps) {
  const [families, setFamilies] = useState<JobFamily[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingFamily, setEditingFamily] = useState<JobFamily | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color_class: DEFAULT_COLORS[0],
  });

  useEffect(() => {
    if (open) {
      fetchFamilies();
    }
  }, [open]);

  const fetchFamilies = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('job_families')
      .select('*')
      .order('name');

    if (error) {
      toast.error("Erro ao carregar famílias de cargos");
      console.error(error);
    } else {
      setFamilies(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Nome da família é obrigatório");
      return;
    }

    setLoading(true);

    if (editingFamily) {
      const { error } = await supabase
        .from('job_families')
        .update({
          name: formData.name,
          description: formData.description || null,
          color_class: formData.color_class,
        })
        .eq('id', editingFamily.id);

      if (error) {
        toast.error("Erro ao atualizar família");
        console.error(error);
      } else {
        toast.success("Família atualizada com sucesso");
        setShowDialog(false);
        resetForm();
        fetchFamilies();
      }
    } else {
      const { error } = await supabase
        .from('job_families')
        .insert({
          name: formData.name,
          description: formData.description || null,
          color_class: formData.color_class,
        });

      if (error) {
        if (error.code === '23505') {
          toast.error("Já existe uma família com este nome");
        } else {
          toast.error("Erro ao criar família");
          console.error(error);
        }
      } else {
        toast.success("Família criada com sucesso");
        setShowDialog(false);
        resetForm();
        fetchFamilies();
      }
    }

    setLoading(false);
  };

  const handleToggleActive = async (family: JobFamily) => {
    const { error } = await supabase
      .from('job_families')
      .update({ is_active: !family.is_active })
      .eq('id', family.id);

    if (error) {
      toast.error("Erro ao atualizar status");
      console.error(error);
    } else {
      toast.success(`Família ${!family.is_active ? 'ativada' : 'desativada'}`);
      fetchFamilies();
    }
  };

  const handleDelete = async (family: JobFamily) => {
    if (!confirm(`Tem certeza que deseja excluir a família "${family.name}"?`)) {
      return;
    }

    const { error } = await supabase
      .from('job_families')
      .delete()
      .eq('id', family.id);

    if (error) {
      if (error.code === '23503') {
        toast.error("Não é possível excluir esta família pois há cargos vinculados");
      } else {
        toast.error("Erro ao excluir família");
        console.error(error);
      }
    } else {
      toast.success("Família excluída com sucesso");
      fetchFamilies();
    }
  };

  const handleEdit = (family: JobFamily) => {
    setEditingFamily(family);
    setFormData({
      name: family.name,
      description: family.description || "",
      color_class: family.color_class || DEFAULT_COLORS[0],
    });
    setShowDialog(true);
  };

  const resetForm = () => {
    setEditingFamily(null);
    setFormData({
      name: "",
      description: "",
      color_class: DEFAULT_COLORS[0],
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Famílias de Cargos</DialogTitle>
            <DialogDescription>
              Adicione, edite ou desative famílias de cargos
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Button onClick={() => setShowDialog(true)} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Nova Família
            </Button>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Cor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {families.map((family) => (
                  <TableRow key={family.id}>
                    <TableCell className="font-medium">{family.name}</TableCell>
                    <TableCell>{family.description || "-"}</TableCell>
                    <TableCell>
                      <Badge className={family.color_class || ""}>
                        {family.name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={family.is_active}
                        onCheckedChange={() => handleToggleActive(family)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(family)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(family)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDialog} onOpenChange={(open) => {
        setShowDialog(open);
        if (!open) resetForm();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingFamily ? "Editar Família" : "Nova Família"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Analistas"
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição opcional"
              />
            </div>

            <div>
              <Label>Cor</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {DEFAULT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color_class: color })}
                    className={`p-2 rounded border-2 ${
                      formData.color_class === color
                        ? 'border-primary'
                        : 'border-transparent'
                    }`}
                  >
                    <Badge className={color}>Exemplo</Badge>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowDialog(false);
              resetForm();
            }}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {editingFamily ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
