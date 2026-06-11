import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface Employee {
  id: string;
  full_name: string;
  avatar_url?: string | null;
  job_title?: string | null;
  grade?: string | null;
  employee_number?: string | null;
}

interface EmployeeComboboxProps {
  employees: Employee[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  excludeIds?: string[];
  showGrade?: boolean;
}

export function EmployeeCombobox({
  employees,
  value,
  onChange,
  placeholder = "Selecione o colaborador",
  disabled = false,
  excludeIds = [],
  showGrade = false,
}: EmployeeComboboxProps) {
  const [open, setOpen] = useState(false);

  const filteredEmployees = employees.filter(
    (emp) => !excludeIds.includes(emp.id)
  );

  const selectedEmployee = filteredEmployees.find((emp) => emp.id === value);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          {selectedEmployee ? (
            <div className="flex items-center gap-2 truncate">
              <Avatar className="h-6 w-6">
                <AvatarImage src={selectedEmployee.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {getInitials(selectedEmployee.full_name)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{selectedEmployee.full_name}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Digite para buscar..." />
          <CommandList>
            <CommandEmpty>Nenhum colaborador encontrado.</CommandEmpty>
            <CommandGroup>
              {filteredEmployees.map((employee) => (
                <CommandItem
                  key={employee.id}
                  value={`${employee.full_name} ${employee.employee_number || ""} ${employee.job_title || ""}`}
                  onSelect={() => {
                    onChange(employee.id === value ? "" : employee.id);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={employee.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(employee.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{employee.full_name}</p>
                      {(employee.job_title || employee.grade) && (
                        <p className="text-xs text-muted-foreground truncate">
                          {employee.job_title}
                          {showGrade && employee.grade && (
                            <span className="ml-1">(Grade {employee.grade})</span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === employee.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
