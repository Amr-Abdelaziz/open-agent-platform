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
  const { deleteDocument, processDocument } = useRagContext();
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Document Name</TableHead>
          <TableHead>Collection</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date Uploaded</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={5}
              className="text-muted-foreground text-center"
            >
              No documents found in this collection.
            </TableCell>
          </TableRow>
        ) : (
          documents.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <FileIcon className="size-4 text-primary/70" />
                  <span>{doc.title || doc.metadata?.name || "Untitled"}</span>
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
                    Embedded
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground gap-1 h-6 opacity-70">
                    <Cpu className="size-3 animate-pulse" />
                    Pending
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
                        View Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onView(doc, "pdf")}>
                        <FileIcon className="mr-2 h-4 w-4" />
                        View PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => processDocument(selectedCollection.uuid, doc.id)}
                        disabled={actionsDisabled}
                      >
                        <Cpu className="mr-2 h-4 w-4" />
                        Process & Embed
                      </DropdownMenuItem>
                      <Separator className="my-1" />
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          className="text-destructive"
                          disabled={actionsDisabled}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete the document
                        <span className="font-semibold">
                          {" "}
                          {doc.title || doc.metadata?.name || "Untitled"}
                        </span>
                        .
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={async () => await deleteDocument(doc.id)}
                        className="bg-destructive hover:bg-destructive/90 text-white"
                        disabled={actionsDisabled}
                      >
                        Delete
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
