import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface CBOCode {
  code: string;
  title: string;
  family: string | null;
}

interface CBOSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function CBOSearchInput({ value, onChange, placeholder = "Digite código ou título..." }: CBOSearchInputProps) {
  const [search, setSearch] = useState(value);
  const [results, setResults] = useState<CBOCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync external value changes
  useEffect(() => {
    if (value !== search) {
      setSearch(value);
      // If value is set externally, try to find the title
      if (value && /^\d{4}-\d{2}$/.test(value)) {
        fetchTitleForCode(value);
      }
    }
  }, [value]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchTitleForCode = async (code: string) => {
    const { data } = await supabase
      .from("cbo_codes")
      .select("title")
      .eq("code", code)
      .single();
    if (data) {
      setSelectedTitle(data.title);
    }
  };

  const searchCBO = async (term: string) => {
    if (!term || term.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      // Search by code or title
      const isCodeSearch = /^\d/.test(term);
      
      let query = supabase
        .from("cbo_codes")
        .select("code, title, family")
        .limit(10);
      
      if (isCodeSearch) {
        query = query.ilike("code", `${term}%`);
      } else {
        query = query.ilike("title", `%${term}%`);
      }
      
      const { data, error } = await query.order("code");
      
      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error("Error searching CBO:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearch(term);
    setShowDropdown(true);
    setSelectedTitle("");
    
    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      searchCBO(term);
    }, 300);

    // If user is typing a valid CBO format, update parent
    if (/^\d{4}-\d{2}$/.test(term)) {
      onChange(term);
    }
  };

  const handleSelect = (cbo: CBOCode) => {
    setSearch(cbo.code);
    setSelectedTitle(cbo.title);
    onChange(cbo.code);
    setShowDropdown(false);
    setResults([]);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          value={search}
          onChange={handleInputChange}
          onFocus={() => search.length >= 2 && setShowDropdown(true)}
          placeholder={placeholder}
          maxLength={7}
          className="pr-10"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </div>
      </div>

      {selectedTitle && (
        <p className="text-xs text-muted-foreground mt-1">{selectedTitle}</p>
      )}

      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {results.map((cbo) => (
            <button
              key={cbo.code}
              type="button"
              onClick={() => handleSelect(cbo)}
              className={cn(
                "w-full text-left px-3 py-2 hover:bg-accent transition-colors",
                "flex flex-col border-b border-border/50 last:border-b-0"
              )}
            >
              <span className="font-medium text-sm">
                <span className="text-primary">{cbo.code}</span>
                <span className="mx-2 text-muted-foreground">—</span>
                {cbo.title}
              </span>
              {cbo.family && (
                <span className="text-xs text-muted-foreground">{cbo.family}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {showDropdown && search.length >= 2 && !loading && results.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg p-3 text-center text-sm text-muted-foreground">
          Nenhum CBO encontrado
        </div>
      )}
    </div>
  );
}
