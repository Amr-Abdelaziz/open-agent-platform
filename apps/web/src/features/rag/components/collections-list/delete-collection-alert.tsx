import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useLanguage } from "@/providers/Language";
import { Trash2 } from "lucide-react";
import type { Collection } from "@/types/collection";

export function DeleteCollectionAlert({
  collection,
  onDelete,
}: {
  collection: Collection;
  onDelete: (id: string) => void;
}) {
  const { t } = useLanguage();
  return (
    <AlertDialog>
      <AlertDialogTrigger
        asChild
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start px-2 py-1.5 text-sm"
        >
          <Trash2 className="text-destructive mr-2 h-4 w-4" />
          <span>{t('delete')}</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('delete_collection')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('delete_collection_confirm').replace('{name}', collection.name)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onDelete(collection.uuid)}
            className="bg-destructive hover:bg-destructive/90 text-white"
          >
            {t('delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
