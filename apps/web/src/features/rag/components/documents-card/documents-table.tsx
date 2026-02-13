"use client";

import type React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Trash2, MoreVertical, Eye, File as FileIcon, Cpu } from "lucide-react";
import { ApiDocument } from "../../hooks/use-rag";
import { useRagContext } from "../../providers/RAG";
import { format } from "date-fns";
import { Collection } from "@/types/collection";
import { getCollectionName } from "../../hooks/use-rag";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/providers/Language";

interface DocumentsTableProps {
  documents: ApiDocument[];
  selectedCollection: Collection;
  actionsDisabled: boolean;
  onView: (document: ApiDocument, defaultTab?: string) => void;
}

export function DocumentsTable({
  documents,
  selectedCollection,
  actionsDisabled,
  onView,
}: DocumentsTableProps) {
  const { t } = useLanguage();
  const { deleteDocument, processDocument } = useRagContext();
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('document_name')}</TableHead>
          <TableHead>{t('collections')}</TableHead>
          <TableHead>{t('status')}</TableHead>
          <TableHead>{t('date_uploaded')}</TableHead>
          <TableHead className="text-right">{t('actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={5}
              className="text-muted-foreground text-center"
            >
              {t('no_documents_found')}
            </TableCell>
          </TableRow>
        ) : (
          documents.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <FileIcon className="size-4 text-primary/70" />
                  <span>{doc.title || doc.metadata?.name || t('untitled')}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {getCollectionName(selectedCollection.name)}
                </Badge>
              </TableCell>
              <TableCell>
                {doc.metadata?.embedding_status === "completed" ? (
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1 h-6">
                    <Cpu className="size-3" />
                    {t('embedded')}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground gap-1 h-6 opacity-70">
                    <Cpu className="size-3 animate-pulse" />
                    {t('pending')}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {doc.created_at || doc.metadata?.created_at
                  ? format(
                    new Date(doc.created_at || doc.metadata?.created_at),
                    "MM/dd/yyyy h:mm a",
                  )
                  : "N/A"}
              </TableCell>
              <TableCell className="text-right">
                <AlertDialog>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(doc)}>
                        <Eye className="mr-2 h-4 w-4" />
                        {t('view_preview')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onView(doc, "pdf")}>
                        <FileIcon className="mr-2 h-4 w-4" />
                        {t('view_pdf')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => processDocument(selectedCollection.uuid, doc.id)}
                        disabled={actionsDisabled}
                      >
                        <Cpu className="mr-2 h-4 w-4" />
                        {t('process_embed')}
                      </DropdownMenuItem>
                      <Separator className="my-1" />
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          className="text-destructive"
                          disabled={actionsDisabled}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t('delete')}
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {t('are_you_sure')}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('action_undone_delete').replace('{name}', doc.title || doc.metadata?.name || t('untitled'))}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={async () => await deleteDocument(doc.id)}
                        className="bg-destructive hover:bg-destructive/90 text-white"
                        disabled={actionsDisabled}
                      >
                        {t('delete')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
