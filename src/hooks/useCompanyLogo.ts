import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useCompanyLogo = () => {
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanyLogo = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("root_company_id")
          .eq("id", session.user.id)
          .single();

        if (profile?.root_company_id) {
          const { data: company } = await supabase
            .from("organizational_structure")
            .select("logo_url, name, fantasy_name")
            .eq("id", profile.root_company_id)
            .single();

          if (company) {
            setCompanyLogo(company.logo_url || null);
            setCompanyName(company.fantasy_name || company.name);
          }
        }
      } catch (error) {
        console.error("Error fetching company logo:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyLogo();
  }, []);

  return { companyLogo, companyName, loading };
};