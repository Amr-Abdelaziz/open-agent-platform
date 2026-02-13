import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Search } from "@/components/ui/tool-search";
import { Button } from "@/components/ui/button";
import {
  ConfigField,
  ConfigFieldAgents,
  ConfigFieldRAG,
  ConfigFieldTool,
} from "@/features/chat/components/configuration-sidebar/config-field";
import { useSearchTools } from "@/hooks/use-search-tools";
import { useMCPContext } from "@/providers/MCP";
import { useAuthContext } from "@/providers/Auth";
import React, { useEffect, useState } from "react";
import {
  ConfigurableFieldAgentsMetadata,
  ConfigurableFieldMCPMetadata,
  ConfigurableFieldRAGMetadata,
  ConfigurableFieldUIMetadata,
} from "@/types/configurable";
import _ from "lodash";
import { useFetchPreselectedTools } from "@/hooks/use-fetch-preselected-tools";
import { Controller, useFormContext } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCircle } from "lucide-react";

export function AgentFieldsFormLoading() {
  return (
    <div className="flex w-full flex-col items-start justify-start gap-2 space-y-2">
      {Array.from({ length: 2 }).map((_, index) => (
        <div
          key={`loading-${index}`}
          className="flex w-full flex-col items-start justify-start gap-2"
        >
          <Skeleton className="h-10 w-[85%]" />
          <Skeleton className="h-16 w-full" />
        </div>
      ))}
    </div>
  );
}

interface AgentFieldsFormProps {
  configurations: ConfigurableFieldUIMetadata[];
  toolConfigurations: ConfigurableFieldMCPMetadata[];
  agentId: string;
  ragConfigurations: ConfigurableFieldRAGMetadata[];
  agentsConfigurations: ConfigurableFieldAgentsMetadata[];
}

export function AgentFieldsForm({
  configurations,
  toolConfigurations,
  agentId,
  ragConfigurations,
  agentsConfigurations,
}: AgentFieldsFormProps) {
  const form = useFormContext<{
    name: string;
    description: string;
    config: Record<string, any>;
  }>();

  const { session } = useAuthContext();
  const [personas, setPersonas] = useState<any[]>([]);
  const [loadingPersonas, setLoadingPersonas] = useState(false);

  useEffect(() => {
    const fetchPersonas = async () => {
      const ragApiUrl = process.env.NEXT_PUBLIC_RAG_API_URL;
      if (!ragApiUrl || !session?.accessToken) return;
      try {
        setLoadingPersonas(true);
        const response = await fetch(`${ragApiUrl}/api/profiles/admin/personas`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        if (response.ok) {
          const data = await response.json();
          setPersonas(data.map((p: any) => ({
            ...p,
            tools: typeof p.tools === 'string' ? JSON.parse(p.tools) : (p.tools || []),
            goals: typeof p.goals === 'string' ? JSON.parse(p.goals) : (p.goals || []),
            capabilities: typeof p.capabilities === 'string' ? JSON.parse(p.capabilities) : (p.capabilities || []),
          })));
        }
      } catch (error) {
        console.error("Failed to fetch personas", error);
      } finally {
        setLoadingPersonas(false);
      }
    };
    fetchPersonas();
  }, [session]);

  const handlePersonaChange = (personaTitle: string) => {
    const persona = personas.find(p => p.job_title === personaTitle);
    if (persona) {
      form.setValue("name", persona.job_title);
      form.setValue("description", persona.persona_text);

      // Map Persona fields to a detailed professional system prompt
      const goalsSection = persona.goals?.length
        ? `\n\n## PRIMARY GOALS\n${persona.goals.map((g: string) => `- ${g}`).join('\n')}`
        : '';
      const capabilitiesSection = persona.capabilities?.length
        ? `\n\n## CORE CAPABILITIES\n${persona.capabilities.map((c: string) => `- ${c}`).join('\n')}`
        : '';

      const professionalPrompt = `# ROLE & CORE IDENTITY\n${persona.persona_text}${goalsSection}${capabilitiesSection}\n\n## OPERATING GUIDELINES\n- Maintain a professional, objective, and efficient tone.\n- Adhere strictly to the defined goals and capabilities.\n- Ensure all responses are high-quality, accurate, and tailored to the persona's expertise.`;

      form.setValue("config.system_prompt", professionalPrompt);
      form.setValue("config.rag_context", persona.rag_context || "");

      if (toolConfigurations[0]?.label) {
        const currentToolsConfig = toolConfigurations[0].default || { tools: [] };
        form.setValue(`config.${toolConfigurations[0].label}`, {
          ...currentToolsConfig,
          tools: persona.tools || [],
        });
      }
    }
  };

  const { tools, setTools, getTools, cursor, loading } = useMCPContext();
  const { toolSearchTerm, debouncedSetSearchTerm, displayTools } =
    useSearchTools(tools, {
      preSelectedTools: toolConfigurations[0]?.default?.tools,
    });

  const { loadingMore, setLoadingMore } = useFetchPreselectedTools({
    tools,
    setTools,
    getTools,
    cursor,
    toolConfigurations,
    searchTerm: toolSearchTerm,
  });

  return (
    <div className="flex flex-col gap-8 py-4">
      <div className="flex w-full flex-col items-start justify-start gap-4 space-y-2">
        <p className="text-lg font-semibold tracking-tight">Agent Template (Registry)</p>
        <div className="flex w-full flex-col items-start justify-start gap-2">
          <Label htmlFor="persona_select">Select Persona</Label>
          <Select onValueChange={handlePersonaChange}>
            <SelectTrigger id="persona_select" className="w-full">
              <SelectValue placeholder={loadingPersonas ? "Loading personas..." : "Choose a persona to pre-fill..."} />
            </SelectTrigger>
            <SelectContent>
              {personas.map(p => (
                <SelectItem key={p.job_title} value={p.job_title}>
                  <div className="flex items-center gap-2">
                    <UserCircle className="size-4 text-blue-500" />
                    <span>{p.job_title}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[10px] text-muted-foreground uppercase italic px-1">Selecting a persona will pre-fill name, description, and tools.</p>
        </div>
      </div>

      <Separator />

      <div className="flex w-full flex-col items-start justify-start gap-2 space-y-2">
        <p className="text-lg font-semibold tracking-tight">Agent Details</p>
        <div className="flex w-full flex-col items-start justify-start gap-2">
          <Label htmlFor="oap_name">
            Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="oap_name"
            {...form.register("name")}
            placeholder="Emails Agent"
          />
        </div>
        <div className="flex w-full flex-col items-start justify-start gap-2">
          <Label htmlFor="oap_description">
            Description <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="oap_description"
            {...form.register("description")}
            placeholder="Agent that handles emails"
          />
        </div>
      </div>

      <Separator />

      <div className="flex w-full flex-col items-start justify-start gap-4 space-y-2">
        <p className="text-lg font-semibold tracking-tight">Core Identity</p>
        <div className="flex w-full flex-col items-start justify-start gap-2">
          <Label htmlFor="system_prompt">System Prompt</Label>
          <Controller
            control={form.control}
            name="config.system_prompt"
            render={({ field }) => (
              <Textarea
                id="system_prompt"
                {...field}
                placeholder="The system instructions for the agent..."
                className="min-h-[150px]"
              />
            )}
          />
          <p className="text-xs text-muted-foreground">This defines the core behavior and personality of the agent.</p>
        </div>

        <div className="flex w-full flex-col items-start justify-start gap-2">
          <Label htmlFor="rag_context">Additional Context (RAG)</Label>
          <Controller
            control={form.control}
            name="config.rag_context"
            render={({ field }) => (
              <Textarea
                id="rag_context"
                {...field}
                placeholder="Paste any additional context or knowledge here..."
                className="min-h-[100px]"
              />
            )}
          />
        </div>
      </div>

      <>
        {configurations.length > 0 && (
          <>
            <Separator />
            <div className="flex w-full flex-col items-start justify-start gap-2 space-y-2">
              <p className="text-lg font-semibold tracking-tight">
                Agent Configuration
              </p>
              {configurations
                .filter(c => !['system_prompt', 'goals', 'capabilities', 'rag_context'].includes(c.label))
                .map((c, index) => (
                  <Controller
                    key={`${c.label}-${index}`}
                    control={form.control}
                    name={`config.${c.label}`}
                    render={({ field: { value, onChange } }) => (
                      <ConfigField
                        className="w-full"
                        id={c.label}
                        label={c.label}
                        type={
                          c.type === "boolean" ? "switch" : (c.type ?? "text")
                        }
                        description={c.description}
                        placeholder={c.placeholder}
                        options={c.options}
                        min={c.min}
                        max={c.max}
                        step={c.step}
                        value={value}
                        setValue={onChange}
                        agentId={agentId}
                      />
                    )}
                  />
                ))}
            </div>
          </>
        )}
        {toolConfigurations.length > 0 && (
          <>
            <Separator />
            <div className="flex w-full flex-col items-start justify-start gap-4">
              <p className="text-lg font-semibold tracking-tight">
                Agent Tools
              </p>
              <Search
                onSearchChange={debouncedSetSearchTerm}
                placeholder="Search tools..."
                className="w-full"
              />
              <div className="relative w-full flex-1 basis-[500px] rounded-md border-[1px] border-slate-200 px-4">
                <div className="absolute inset-0 overflow-y-auto px-4">
                  {toolConfigurations[0]?.label
                    ? displayTools.map((c) => (
                      <Controller
                        key={`tool-${c.name}`}
                        control={form.control}
                        name={`config.${toolConfigurations[0].label}`}
                        render={({ field: { value, onChange } }) => (
                          <ConfigFieldTool
                            key={`tool-${c.name}`}
                            id={c.name}
                            label={c.name}
                            description={c.description}
                            agentId={agentId}
                            toolId={toolConfigurations[0].label}
                            className="border-b-[1px] py-4"
                            value={value}
                            setValue={onChange}
                          />
                        )}
                      />
                    ))
                    : null}
                  {displayTools.length === 0 && toolSearchTerm && (
                    <p className="my-4 w-full text-center text-sm text-slate-500">
                      No tools found matching "{toolSearchTerm}".
                    </p>
                  )}
                  {tools.length === 0 && !toolSearchTerm && (
                    <p className="my-4 w-full text-center text-sm text-slate-500">
                      No tools available for this agent.
                    </p>
                  )}
                  {cursor && !toolSearchTerm && (
                    <div className="flex justify-center py-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            setLoadingMore(true);
                            const moreTool = await getTools(cursor);
                            setTools((prevTools) => [
                              ...prevTools,
                              ...moreTool,
                            ]);
                          } catch (error) {
                            console.error("Failed to load more tools:", error);
                          } finally {
                            setLoadingMore(false);
                          }
                        }}
                        disabled={loadingMore || loading}
                      >
                        {loadingMore ? "Loading..." : "Load More Tools"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
        {ragConfigurations.length > 0 && (
          <>
            <Separator />
            <div className="flex w-full flex-col items-start justify-start gap-2">
              <p className="text-lg font-semibold tracking-tight">Agent RAG</p>
              <Controller
                control={form.control}
                name={`config.${ragConfigurations[0].label}`}
                render={({ field: { value, onChange } }) => (
                  <ConfigFieldRAG
                    id={ragConfigurations[0].label}
                    label={ragConfigurations[0].label}
                    agentId={agentId}
                    value={value}
                    setValue={onChange}
                  />
                )}
              />
            </div>
          </>
        )}
        {agentsConfigurations.length > 0 && (
          <>
            <Separator />
            <div className="flex w-full flex-col items-start justify-start gap-2">
              <p className="text-lg font-semibold tracking-tight">
                Supervisor Agents
              </p>
              <Controller
                control={form.control}
                name={`config.${agentsConfigurations[0].label}`}
                render={({ field: { value, onChange } }) => (
                  <ConfigFieldAgents
                    id={agentsConfigurations[0].label}
                    label={agentsConfigurations[0].label}
                    agentId={agentId}
                    value={value}
                    setValue={onChange}
                  />
                )}
              />
            </div>
          </>
        )}
      </>
    </div>
  );
}
