import { useState, useEffect } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FloppyDisk, X, Plus } from "@phosphor-icons/react";

export type DrawerField = {
  key: string;
  label: string;
  value?: string;
  values?: string[];
  multiline?: boolean;
  list?: boolean;
  placeholder?: string;
};

interface EditItemDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  fields: DrawerField[];
  onSave: (values: Record<string, string | string[]>) => void;
}

export function EditItemDrawer({
  open,
  onClose,
  title,
  fields,
  onSave,
}: EditItemDrawerProps) {
  const [values, setValues] = useState<Record<string, string | string[]>>({});

  useEffect(() => {
    if (open) {
      const initial: Record<string, string | string[]> = {};
      fields.forEach((f) => {
        if (f.list) {
          initial[f.key] = f.values && f.values.length > 0 ? [...f.values] : [];
        } else {
          initial[f.key] = f.value || "";
        }
      });
      setValues(initial);
    }
  }, [open, fields]);

  const handleSave = () => {
    onSave(values);
    onClose();
  };

  const updateListItem = (key: string, index: number, val: string) => {
    setValues((prev) => {
      const arr = [...(prev[key] as string[])];
      arr[index] = val;
      return { ...prev, [key]: arr };
    });
  };

  const removeListItem = (key: string, index: number) => {
    setValues((prev) => {
      const arr = [...(prev[key] as string[])];
      arr.splice(index, 1);
      return { ...prev, [key]: arr };
    });
  };

  const addListItem = (key: string) => {
    setValues((prev) => ({
      ...prev,
      [key]: [...(prev[key] as string[]), ""],
    }));
  };

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="flex items-center justify-between">
          <DrawerTitle className="font-display text-lg font-bold">
            {title}
          </DrawerTitle>
          <DrawerClose asChild>
            <button className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors">
              <X size={18} />
            </button>
          </DrawerClose>
        </DrawerHeader>

        <ScrollArea className="flex-1 px-4 pb-2">
          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <label className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  {field.label}
                </label>

                {field.list ? (
                  <div className="space-y-2">
                    {((values[field.key] as string[]) || []).map((item, idx) => (
                      <div key={idx} className="flex gap-2 items-start">
                        <Textarea
                          value={item}
                          onChange={(e) => updateListItem(field.key, idx, e.target.value)}
                          placeholder={field.placeholder}
                          rows={2}
                          className="resize-none bg-surface border-border flex-1 min-h-[56px]"
                        />
                        <button
                          onClick={() => removeListItem(field.key, idx)}
                          className="p-1.5 mt-1 rounded text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                          aria-label="Rimuovi"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addListItem(field.key)}
                      className="inline-flex items-center gap-1 rounded-md border border-dashed border-border px-2.5 py-1.5 font-mono text-[11px] uppercase text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                    >
                      <Plus size={12} weight="bold" />
                      Aggiungi
                    </button>
                  </div>
                ) : field.multiline ? (
                  <Textarea
                    value={(values[field.key] as string) ?? ""}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    placeholder={field.placeholder}
                    rows={4}
                    className="resize-none bg-surface border-border"
                  />
                ) : (
                  <Input
                    value={(values[field.key] as string) ?? ""}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    placeholder={field.placeholder}
                    className="bg-surface border-border"
                  />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <DrawerFooter>
          <Button onClick={handleSave} className="w-full gap-2">
            <FloppyDisk size={16} /> Salva
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
