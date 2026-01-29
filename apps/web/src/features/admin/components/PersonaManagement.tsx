"use client";

import React, { useEffect, useState } from "react";
import {
    Brain,
    Plus,
    Trash2,
    Save,
    X,
    MessageSquare,
    Target,
    Zap,
    Database,
    PlusCircle,
    UserCircle,
    Edit2
} from "lucide-react";
import { useAuthContext } from "@/providers/Auth";
import { useAgentsContext } from "@/providers/Agents";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface Persona {
    job_title: string;
    persona_text: string;
    goals: string[];
    rag_context: string;
    capabilities: string[];
    assigned_agent_id?: string;
    assigned_deployment_id?: string;
}

export function PersonaManagement() {
    const { session } = useAuthContext();
    const { agents } = useAgentsContext();
    const [personas, setPersonas] = useState<Persona[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingTitle, setEditingTitle] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<Persona | null>(null);

    const fetchPersonas = async () => {
        const ragApiUrl = process.env.NEXT_PUBLIC_RAG_API_URL;
        if (!ragApiUrl || !session?.accessToken) return;

        try {
            const response = await fetch(`${ragApiUrl}/api/profiles/admin/personas`, {
                headers: { Authorization: `Bearer ${session.accessToken}` },
            });
            if (!response.ok) throw new Error("Failed to fetch personas");
            const data = await response.json();
            // Data from backend goals/capabilities are strings if they were stringified JSON
            const normalized = data.map((p: any) => ({
                ...p,
                goals: typeof p.goals === 'string' ? JSON.parse(p.goals) : p.goals,
                capabilities: typeof p.capabilities === 'string' ? JSON.parse(p.capabilities) : p.capabilities,
            }));
            setPersonas(normalized);
        } catch (error) {
            toast.error("Failed to load personas");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPersonas();
    }, [session]);

    const handleStartEdit = (persona: Persona) => {
        setEditingTitle(persona.job_title);
        setEditValues({ ...persona });
    };

    const handleAddNew = () => {
        const newPersona: Persona = {
            job_title: "New Role",
            persona_text: "",
            goals: [],
            rag_context: "general_knowledge",
            capabilities: []
        };
        setEditingTitle("NEW");
        setEditValues(newPersona);
    };

    const handleSave = async () => {
        if (!editValues) return;
        const ragApiUrl = process.env.NEXT_PUBLIC_RAG_API_URL;
        try {
            const response = await fetch(`${ragApiUrl}/api/profiles/admin/personas`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.accessToken}`,
                },
                body: JSON.stringify(editValues),
            });
            if (!response.ok) throw new Error("Save failed");
            toast.success("Persona saved successfully");
            setEditingTitle(null);
            fetchPersonas();
        } catch (error) {
            toast.error("Error saving persona");
        }
    };

    const handleDelete = async (title: string) => {
        if (!confirm(`Are you sure you want to delete the persona for ${title}?`)) return;
        const ragApiUrl = process.env.NEXT_PUBLIC_RAG_API_URL;
        try {
            const response = await fetch(`${ragApiUrl}/api/profiles/admin/personas/${encodeURIComponent(title)}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${session?.accessToken}` },
            });
            if (!response.ok) throw new Error("Delete failed");
            toast.success("Persona deleted");
            fetchPersonas();
        } catch (error) {
            toast.error("Error deleting persona");
        }
    };

    const updateArrayField = (field: 'goals' | 'capabilities', index: number, value: string) => {
        if (!editValues) return;
        const newArr = [...editValues[field]];
        newArr[index] = value;
        setEditValues({ ...editValues, [field]: newArr });
    };

    const addArrayItem = (field: 'goals' | 'capabilities') => {
        if (!editValues) return;
        setEditValues({ ...editValues, [field]: [...editValues[field], ""] });
    };

    const removeArrayItem = (field: 'goals' | 'capabilities', index: number) => {
        if (!editValues) return;
        const newArr = editValues[field].filter((_, i) => i !== index);
        setEditValues({ ...editValues, [field]: newArr });
    };

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading personas...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold">Persona Library</h2>
                    <p className="text-sm text-muted-foreground">Define how the AI agent behaves for specific job titles.</p>
                </div>
                <Button onClick={handleAddNew} className="gap-2">
                    <PlusCircle className="size-4" />
                    Create Persona
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AnimatePresence mode="popLayout">
                    {personas.map((p) => (
                        <motion.div
                            key={p.job_title}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                            <Card className="h-full border-none glass-card hover:neon-border-blue/20 transition-all group">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                                            <Brain className="size-4" />
                                        </div>
                                        <CardTitle className="text-lg font-bold">{p.job_title}</CardTitle>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button size="icon" variant="ghost" className="size-8 hover:bg-primary/10 hover:text-primary" onClick={() => handleStartEdit(p)}>
                                            <Edit2 className="size-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="size-8 text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={() => handleDelete(p.job_title)}>
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="text-sm text-muted-foreground line-clamp-2 italic">
                                        "{p.persona_text}"
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {p.capabilities.map(c => (
                                            <Badge key={c} variant="secondary" className="text-[10px] uppercase font-bold tracking-tighter bg-blue-500/5 text-blue-400 border-none">
                                                {c}
                                            </Badge>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest font-black">
                                        <Database className="size-3" />
                                        Context: {p.rag_context}
                                    </div>
                                    {p.assigned_agent_id && (
                                        <div className="flex items-center gap-2 text-[10px] text-primary uppercase tracking-widest font-black">
                                            <UserCircle className="size-3" />
                                            Agent: {agents.find(a => a.assistant_id === p.assigned_agent_id)?.name || p.assigned_agent_id}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Edit Modal / Overlays would be better, but let's do a bottom sheet style for simplicity */}
            <AnimatePresence>
                {editValues && (
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        className="fixed inset-x-0 bottom-0 z-50 p-6 bg-background/80 backdrop-blur-xl border-t border-border shadow-2xl overflow-y-auto max-h-[80vh]"
                    >
                        <div className="max-w-4xl mx-auto space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-2">
                                    {editingTitle === "NEW" ? "Initialize Neural Persona" : `Sync Persona: ${editingTitle}`}
                                </h3>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => setEditValues(null)}>Cancel</Button>
                                    <Button onClick={handleSave} className="gap-2 bg-blue-600 hover:bg-blue-700">
                                        <Save className="size-4" /> {editingTitle === "NEW" ? "Create Persona" : "Save Changes"}
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1 block">Job Title / Identifier</label>
                                        <Input
                                            value={editValues.job_title}
                                            onChange={(e) => setEditValues({ ...editValues, job_title: e.target.value })}
                                            disabled={editingTitle !== "NEW"}
                                            placeholder="e.g. Frontend Engineer"
                                            className="font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1 block flex items-center gap-2">
                                            <MessageSquare className="size-3" /> Core Identity (Arabic Recommended)
                                        </label>
                                        <Textarea
                                            value={editValues.persona_text}
                                            onChange={(e) => setEditValues({ ...editValues, persona_text: e.target.value })}
                                            rows={5}
                                            placeholder="Describe the AI's personality and domain expertise..."
                                            className="resize-none leading-relaxed"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1 block flex items-center gap-2">
                                            <Database className="size-3" /> RAG Context Collection
                                        </label>
                                        <Input
                                            value={editValues.rag_context}
                                            onChange={(e) => setEditValues({ ...editValues, rag_context: e.target.value })}
                                            placeholder="Collection name for domain knowledge"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1 block flex items-center gap-2">
                                            <UserCircle className="size-3" /> Assigned Agent
                                        </label>
                                        <Select
                                            value={editValues.assigned_agent_id ? `${editValues.assigned_agent_id}:${editValues.assigned_deployment_id}` : "none"}
                                            onValueChange={(v) => {
                                                if (v === "none") {
                                                    setEditValues({ ...editValues, assigned_agent_id: undefined, assigned_deployment_id: undefined });
                                                } else {
                                                    const [aid, did] = v.split(":");
                                                    setEditValues({ ...editValues, assigned_agent_id: aid, assigned_deployment_id: did });
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select an agent for this persona" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">No specific agent (User selection)</SelectItem>
                                                {agents.map(a => (
                                                    <SelectItem key={`${a.assistant_id}:${a.deploymentId}`} value={`${a.assistant_id}:${a.deploymentId}`}>
                                                        {a.name} ({a.graph_id})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-[10px] text-muted-foreground mt-1 uppercase italic">Only administrators can assign specific agents to personas.</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1 block flex items-center justify-between">
                                            <span className="flex items-center gap-2"><Target className="size-3" /> Strategic Goals</span>
                                            <Button variant="ghost" size="sm" onClick={() => addArrayItem('goals')} className="h-6 px-1 text-blue-500 font-black"><Plus className="size-3" /></Button>
                                        </label>
                                        <div className="space-y-2">
                                            {editValues.goals.map((g, i) => (
                                                <div key={i} className="flex gap-2">
                                                    <Input value={g} onChange={(e) => updateArrayField('goals', i, e.target.value)} className="h-9 text-sm" />
                                                    <Button variant="ghost" size="icon" onClick={() => removeArrayItem('goals', i)} className="size-9 shrink-0 text-red-400"><X className="size-4" /></Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1 block flex items-center justify-between">
                                            <span className="flex items-center gap-2"><Zap className="size-3" /> Module Capabilities</span>
                                            <Button variant="ghost" size="sm" onClick={() => addArrayItem('capabilities')} className="h-6 px-1 text-secondary font-black"><Plus className="size-3" /></Button>
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {editValues.capabilities.map((c, i) => (
                                                <Badge key={i} variant="secondary" className="flex items-center gap-1 py-1 px-3">
                                                    <Input
                                                        value={c}
                                                        onChange={(e) => updateArrayField('capabilities', i, e.target.value)}
                                                        className="border-none bg-transparent hover:bg-white/10 p-0 h-4 w-24 text-[10px] font-bold uppercase text-center focus-visible:ring-0"
                                                    />
                                                    <X className="size-3 cursor-pointer hover:text-red-500" onClick={() => removeArrayItem('capabilities', i)} />
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
