"use client";

import { useState } from "react";
import {
  Bot,
  Brain,
  Cloud,
  Edit,
  MessageSquare,
  Trash,
  User,
  Wrench,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Agent } from "@/types/agent";
import { EditAgentDialog } from "./create-edit-agent-dialogs/edit-agent-dialog";
import _ from "lodash";
import NextLink from "next/link";
import { Badge } from "@/components/ui/badge";
import { getDeployments } from "@/lib/environment/deployments";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { isUserCreatedDefaultAssistant } from "@/lib/agent-utils";
import { useAgents } from "@/hooks/use-agents";
import { useAgentsContext } from "@/providers/Agents";
import { toast } from "sonner";

function SupportedConfigBadge({
  type,
}: {
  type: "rag" | "tools" | "supervisor";
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          {type === "rag" && (
            <Badge variant="brand">
              <Brain />
              RAG
            </Badge>
          )}
          {type === "tools" && (
            <Badge variant="info">
              <Wrench />
              MCP Tools
            </Badge>
          )}
          {type === "supervisor" && (
            <Badge variant="brand">
              <User />
              Supervisor
            </Badge>
          )}
        </TooltipTrigger>
        <TooltipContent>This agent supports {type}.</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface AgentCardProps {
  agent: Agent;
  showDeployment?: boolean;
}

export function AgentCard({ agent, showDeployment }: AgentCardProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const deployments = getDeployments();
  const selectedDeployment = deployments.find(
    (d) => d.id === agent.deploymentId,
  );

  const isDefaultAgent = isUserCreatedDefaultAssistant(agent);
  const { deleteAgent } = useAgents();
  const { refreshAgents } = useAgentsContext();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete agent "${agent.name}"?`)) return;

    setIsDeleting(true);
    const success = await deleteAgent(agent.deploymentId, agent.assistant_id);
    setIsDeleting(false);

    if (success) {
      toast.success("Agent deleted successfully");
      refreshAgents();
    }
  };

  return (
    <>
      <Card
        key={agent.assistant_id}
        className="overflow-hidden"
      >
        <CardHeader className="space-y-2 pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="flex w-full flex-wrap items-center gap-2">
              <p>{agent.name}</p>
              {showDeployment && selectedDeployment && (
                <div className="flex flex-wrap items-center gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge variant="outline">
                          <Cloud />
                          {selectedDeployment.name}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        The deployment the graph & agent belongs to.
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger>
                        <Badge variant="outline">
                          <Bot />
                          {agent.graph_id}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        The graph the agent belongs to.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </CardTitle>
          </div>
          <div className="flex flex-0 flex-wrap items-center justify-start gap-2">
            {agent.metadata?.description &&
              typeof agent.metadata.description === "string" ? (
              <p className="text-muted-foreground mt-1 text-sm">
                {agent.metadata.description}
              </p>
            ) : null}
            {agent.supportedConfigs?.map((config) => (
              <SupportedConfigBadge
                key={`${agent.assistant_id}-${config}`}
                type={config}
              />
            ))}
          </div>
        </CardHeader>
        <CardFooter className="mt-auto flex w-full justify-between pt-2">
          {!isDefaultAgent && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditDialog(true)}
              >
                <Edit className="mr-2 h-3.5 w-3.5" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash className="mr-2 h-3.5 w-3.5" />
                )}
                Delete
              </Button>
            </div>
          )}
          <NextLink
            href={`/?agentId=${agent.assistant_id}&deploymentId=${agent.deploymentId}`}
            className="ml-auto"
          >
            <Button size="sm">
              <MessageSquare className="mr-2 h-3.5 w-3.5" />
              Chat
            </Button>
          </NextLink>
        </CardFooter>
      </Card>
      <EditAgentDialog
        agent={agent}
        open={showEditDialog}
        onOpenChange={(c) => setShowEditDialog(c)}
      />
    </>
  );
}
