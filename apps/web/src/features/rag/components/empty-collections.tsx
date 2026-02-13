import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FolderPlus, Layers } from "lucide-react";
import { CreateCollectionDialog } from "./create-collection-dialog";
import { useState } from "react";
import { useRagContext } from "../providers/RAG";
import { toast } from "sonner";
import { useLanguage } from "@/providers/Language";

export default function EmptyCollectionsState() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const { createCollection, setSelectedCollection } = useRagContext();

  const handleSubmit = async (name: string, description: string) => {
    const loadingToast = toast.loading(t('creating_collection'), {
      richColors: true,
    });
    const newCollection = await createCollection(name, {
      description,
    });
    toast.dismiss(loadingToast);
    if (newCollection) {
      setOpen(false);
      toast.success(t('collection_created'), { richColors: true });
      setSelectedCollection(newCollection);
    } else {
      toast.warning(
        t('collection_exists').replace('{name}', name),
        {
          duration: 5000,
          richColors: true,
        },
      );
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[400px] w-full p-4">
      <Card className="glass-card neon-border-purple border-none max-w-lg w-full relative overflow-hidden group">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute -top-24 -right-24 size-48 bg-primary/20 blur-3xl rounded-full" />
        <div className="absolute -bottom-24 -left-24 size-48 bg-secondary/20 blur-3xl rounded-full" />

        <CardContent className="flex flex-col items-center justify-center space-y-8 px-8 py-16 text-center relative z-10">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
            <div className="bg-primary/10 rounded-full p-6 neon-border-purple">
              <Layers className="text-primary h-14 w-14 drop-shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-3xl font-black tracking-tighter bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">
              {t('no_collections')}
            </h3>
            <p className="text-muted-foreground font-medium leading-relaxed">
              {t('rag_experience_message')}
            </p>
          </div>

          <CreateCollectionDialog
            open={open}
            onOpenChange={setOpen}
            onSubmit={handleSubmit}
            trigger={
              <Button
                size="lg"
                className="mt-6 gap-2 bg-primary hover:bg-primary/80 text-primary-foreground font-bold shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all hover:scale-105 active:scale-95"
              >
                <FolderPlus className="h-5 w-5" />
                {t('initialize_orbital_node')}
              </Button>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
