import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useDeleteVaga, type Vaga } from "@/hooks/useVagas";

export const ConfirmarExclusaoVaga = ({ open, onOpenChange, vaga, onDone }: {
  open: boolean; onOpenChange: (o: boolean) => void; vaga: Vaga | null; onDone?: () => void;
}) => {
  const del = useDeleteVaga();
  const excluir = async () => {
    if (!vaga) return;
    try {
      await del.mutateAsync(vaga.id);
      toast.success("Vaga excluída.");
      onOpenChange(false);
      onDone?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível excluir a vaga.");
    }
  };
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir esta vaga?</AlertDialogTitle>
          <AlertDialogDescription>
            {vaga ? `"${vaga.titulo}" será removida. ` : ""}Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={del.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction disabled={del.isPending} onClick={(e) => { e.preventDefault(); excluir(); }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
