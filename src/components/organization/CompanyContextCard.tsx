import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CompanyLogo } from "@/components/CompanyLogo";
import { Building2, Edit, Image, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CompanyContextCardProps {
  onEditClick: () => void;
}

export const CompanyContextCard = ({ onEditClick }: CompanyContextCardProps) => {
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanyData();
  }, []);

  const fetchCompanyData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("root_company_id")
        .eq("id", session.user.id)
        .single();

      if (profile?.root_company_id) {
        // SECURITY: avoid select('*'); sensitive billing columns are admin-only
        const { data } = await supabase
          .from("organizational_structure")
          .select(
            "id, name, type, code, description, fantasy_name, address, logo_url, " +
            "industry_sector, root_company_id, subscription_plan_id, subscription_status, " +
            "trial_ends_at, default_language"
          )
          .eq("id", profile.root_company_id)
          .single();

        setCompany(data);
      }
    } catch (error) {
      console.error("Error fetching company:", error);
      toast.error("Erro ao carregar dados da empresa");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!company) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          Empresa Principal
          <Badge variant="outline" className="ml-auto bg-primary/10 text-primary border-primary/20">
            Ativa
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-4">
          <CompanyLogo
            logoUrl={company.logo_url}
            companyName={company.name}
            size="lg"
          />
          <div className="flex-1 space-y-1">
            <h3 className="text-xl font-bold">
              {company.fantasy_name || company.name}
            </h3>
            {company.fantasy_name && (
              <p className="text-sm text-muted-foreground">
                Razão Social: {company.name}
              </p>
            )}
            {company.cnpj && (
              <p className="text-sm text-muted-foreground font-mono">
                CNPJ: {company.cnpj}
              </p>
            )}
            {company.address && (
              <p className="text-sm text-muted-foreground">
                {company.address}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onEditClick}
            className="flex-1 gap-2"
          >
            <Edit className="w-4 h-4" />
            Editar Dados
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};