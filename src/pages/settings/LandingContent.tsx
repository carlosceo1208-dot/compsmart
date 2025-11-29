import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, Save, RotateCcw, ExternalLink } from "lucide-react";
import { useAllSiteContent, useUpdateSiteContent } from "@/hooks/useSiteContent";
import { toast } from "sonner";

interface ContentField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'array';
  arrayFields?: { key: string; label: string; type: 'text' | 'textarea' }[];
}

const sectionFields: Record<string, ContentField[]> = {
  hero: [
    { key: 'title', label: 'Título Principal', type: 'textarea' },
    { key: 'subtitle', label: 'Subtítulo', type: 'textarea' },
    { key: 'ctaPrimary', label: 'Botão Primário', type: 'text' },
    { key: 'ctaSecondary', label: 'Botão Secundário', type: 'text' },
  ],
  pain_points: [
    { key: 'title', label: 'Título', type: 'text' },
    { key: 'description', label: 'Descrição', type: 'textarea' },
  ],
  smart_agents: [
    { key: 'title', label: 'Título', type: 'text' },
    { key: 'subtitle', label: 'Subtítulo', type: 'textarea' },
  ],
  pricing: [
    { key: 'title', label: 'Título', type: 'text' },
    { key: 'subtitle', label: 'Subtítulo', type: 'textarea' },
    { key: 'annualDiscount', label: 'Texto Desconto Anual', type: 'text' },
  ],
  testimonials: [
    { key: 'title', label: 'Título', type: 'text' },
  ],
  faq: [
    { key: 'title', label: 'Título', type: 'text' },
  ],
  cta_final: [
    { key: 'title', label: 'Título', type: 'text' },
    { key: 'subtitle', label: 'Subtítulo', type: 'textarea' },
    { key: 'ctaPrimary', label: 'Botão Primário', type: 'text' },
    { key: 'ctaSecondary', label: 'Botão Secundário', type: 'text' },
  ],
  footer: [
    { key: 'copyright', label: 'Copyright', type: 'text' },
    { key: 'description', label: 'Descrição', type: 'textarea' },
  ],
};

export default function LandingContent() {
  const { data: sections, isLoading } = useAllSiteContent();
  const updateContent = useUpdateSiteContent();
  const [editedContent, setEditedContent] = useState<Record<string, Record<string, any>>>({});
  const [savingSection, setSavingSection] = useState<string | null>(null);

  const handleFieldChange = (sectionKey: string, fieldKey: string, value: string) => {
    setEditedContent(prev => ({
      ...prev,
      [sectionKey]: {
        ...(prev[sectionKey] || {}),
        [fieldKey]: value
      }
    }));
  };

  const getFieldValue = (section: any, fieldKey: string) => {
    if (editedContent[section.section_key]?.[fieldKey] !== undefined) {
      return editedContent[section.section_key][fieldKey];
    }
    return section.content?.[fieldKey] || '';
  };

  const handleSave = async (section: any) => {
    setSavingSection(section.id);
    try {
      const mergedContent = {
        ...section.content,
        ...editedContent[section.section_key]
      };
      
      await updateContent.mutateAsync({
        id: section.id,
        content: mergedContent
      });
      
      // Clear edited content for this section after save
      setEditedContent(prev => {
        const newState = { ...prev };
        delete newState[section.section_key];
        return newState;
      });
    } finally {
      setSavingSection(null);
    }
  };

  const handleReset = (sectionKey: string) => {
    setEditedContent(prev => {
      const newState = { ...prev };
      delete newState[sectionKey];
      return newState;
    });
    toast.info('Alterações descartadas');
  };

  const hasChanges = (sectionKey: string) => {
    return editedContent[sectionKey] && Object.keys(editedContent[sectionKey]).length > 0;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Conteúdo da Landing Page</h1>
          <p className="text-muted-foreground">
            Edite os textos exibidos na página inicial do CompSmart
          </p>
        </div>
        <Button variant="outline" asChild>
          <a href="/" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Ver Landing Page
          </a>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seções Editáveis</CardTitle>
          <CardDescription>
            Clique em cada seção para expandir e editar os textos. As alterações são salvas individualmente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="space-y-2">
            {sections?.map((section) => {
              const fields = sectionFields[section.section_key] || [];
              const sectionHasChanges = hasChanges(section.section_key);
              
              return (
                <AccordionItem 
                  key={section.id} 
                  value={section.section_key}
                  className="border rounded-lg px-4"
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{section.section_name}</span>
                      {sectionHasChanges && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                          Alterações não salvas
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    {fields.length > 0 ? (
                      <>
                        {fields.map((field) => (
                          <div key={field.key} className="space-y-2">
                            <Label htmlFor={`${section.section_key}-${field.key}`}>
                              {field.label}
                            </Label>
                            {field.type === 'textarea' ? (
                              <Textarea
                                id={`${section.section_key}-${field.key}`}
                                value={getFieldValue(section, field.key)}
                                onChange={(e) => handleFieldChange(section.section_key, field.key, e.target.value)}
                                rows={4}
                                className="resize-none"
                              />
                            ) : (
                              <Input
                                id={`${section.section_key}-${field.key}`}
                                value={getFieldValue(section, field.key)}
                                onChange={(e) => handleFieldChange(section.section_key, field.key, e.target.value)}
                              />
                            )}
                          </div>
                        ))}
                        
                        <div className="flex gap-2 pt-4 border-t">
                          <Button
                            onClick={() => handleSave(section)}
                            disabled={!sectionHasChanges || savingSection === section.id}
                          >
                            {savingSection === section.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4 mr-2" />
                            )}
                            Salvar Seção
                          </Button>
                          {sectionHasChanges && (
                            <Button
                              variant="outline"
                              onClick={() => handleReset(section.section_key)}
                            >
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Descartar
                            </Button>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Esta seção contém dados estruturados (listas, arrays) que ainda não podem ser editados por aqui.
                        Entre em contato com o suporte para alterações.
                      </p>
                    )}
                    
                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      Última atualização: {new Date(section.updated_at).toLocaleString('pt-BR')}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
