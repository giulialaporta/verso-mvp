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
import { FloppyDisk, X } from "@phosphor-icons/react";

export type DrawerField = {
  key: string;
  label: string;
  value: string;
  multiline?: boolean;
  placeholder?: string;
};

interface EditItemDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  fields: DrawerField[];
  onSave: (values: Record<string, string>) => void;
}

export function EditItemDrawer({
  open,
  onClose,
  title,
  fields,
  onSave,
}: EditItemDrawerProps) {
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      const initial: Record<string, string> = {};
      fields.forEach((f) => {
        initial[f.key] = f.value || "";
      });
      setValues(initial);
    }
  }, [open, fields]);

  const handleSave = () => {
    onSave(values);
    onClose();
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
                {field.multiline ? (
                  <Textarea
                    value={values[field.key] ?? ""}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    placeholder={field.placeholder}
                    rows={4}
                    className="resize-none bg-surface border-border"
                  />
                ) : (
                  <Input
                    value={values[field.key] ?? ""}
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
