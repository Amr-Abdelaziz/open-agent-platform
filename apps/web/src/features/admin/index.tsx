"use client";

import React, { useEffect, useState } from "react";
import { Users, Shield, MapPin, Briefcase, Check, X, Edit2, Save, Brain, Trash2 } from "lucide-react";
import { useAuthContext } from "@/providers/Auth";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { PersonaManagement } from "./components/PersonaManagement";

interface Profile {
    user_id: string;
    email: string | null;
    department: string;
    job_title: string;
    is_admin: boolean;
}

const DEPARTMENTS = ["Engineering", "HR & Operations", "Sales & Marketing", "Finance", "Executive"];
const JOB_TITLES = [
    "Engineering Manager",
    "Backend Developer",
    "Frontend Developer",
    "HR Manager",
    "HR Generalist",
    "Sales Manager",
    "Sales Representative",
    "Marketing Manager",
    "Accountant / Finance Manager"
];

export default function AdminInterface() {
    const { session } = useAuthContext();
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<Partial<Profile>>({});

    const fetchProfiles = async () => {
        const ragApiUrl = process.env.NEXT_PUBLIC_RAG_API_URL;
        if (!ragApiUrl || !session?.accessToken) return;

        try {
            const response = await fetch(`${ragApiUrl}/api/profiles/all`, {
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                },
            });

            if (!response.ok) throw new Error("Failed to fetch profiles");
            const data = await response.json();
            setProfiles(data);
        } catch (error) {
            console.error("Error fetching profiles:", error);
            toast.error("Failed to load user profiles");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProfiles();
    }, [session]);

    const handleStartEdit = (profile: Profile) => {
        setEditingId(profile.user_id);
        setEditValues(profile);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditValues({});
    };

    const handleSaveEdit = async () => {
        if (!editingId) return;
        const ragApiUrl = process.env.NEXT_PUBLIC_RAG_API_URL;
        if (!ragApiUrl || !session?.accessToken) return;

        try {
            const response = await fetch(`${ragApiUrl}/api/profiles/admin/update`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.accessToken}`,
                },
                body: JSON.stringify({
                    user_id: editingId,
                    is_admin: editValues.is_admin,
                    department: editValues.department,
                    job_title: editValues.job_title,
                }),
            });

            if (!response.ok) throw new Error("Update failed");

            toast.success("Profile updated successfully");
            setEditingId(null);
            fetchProfiles();
        } catch (error) {
            toast.error("Failed to update profile");
        }
    };

    const handleDeleteUser = async (userId: string, email: string) => {
        if (!confirm(`Are you sure you want to delete user ${email}? This action cannot be undone.`)) return;

        const ragApiUrl = process.env.NEXT_PUBLIC_RAG_API_URL;
        if (!ragApiUrl || !session?.accessToken) return;

        try {
            const response = await fetch(`${ragApiUrl}/api/profiles/admin/delete`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.accessToken}`,
                },
                body: JSON.stringify({ user_id: userId }),
            });

            if (!response.ok) throw new Error("Delete failed");

            toast.success("User deleted successfully");
            fetchProfiles();
        } catch (error) {
            console.error("Error deleting user:", error);
            toast.error("Failed to delete user. Please ensure the endpoint is active.");
        }
    };

    if (isLoading) return <div className="p-10 flex items-center justify-center gap-2">
        <div className="size-4 bg-primary animate-bounce [animation-delay:-0.3s]"></div>
        <div className="size-4 bg-primary animate-bounce [animation-delay:-0.15s]"></div>
        <div className="size-4 bg-primary animate-bounce"></div>
    </div>;

    return (
        <div className="flex w-full flex-col gap-8 p-10 max-w-7xl mx-auto transition-all">
            <header className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-500/10 rounded-2xl text-red-500 ring-1 ring-red-500/20">
                        <Shield className="size-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter uppercase italic">Control Center</h1>
                        <p className="text-muted-foreground font-medium">Administrative bypass and organizational configuration.</p>
                    </div>
                </div>
            </header>

            <Tabs defaultValue="users" className="w-full space-y-6">
                <TabsList className="bg-muted/30 p-1 rounded-xl ring-1 ring-border">
                    <TabsTrigger value="users" className="rounded-lg gap-2 px-6">
                        <Users className="size-4" /> Users
                    </TabsTrigger>
                    <TabsTrigger value="personas" className="rounded-lg gap-2 px-6">
                        <Brain className="size-4" /> AI Personas
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="users">
                    <Card className="border-none glass-card shadow-2xl overflow-hidden">
                        <CardHeader className="bg-muted/20 pb-8">
                            <CardTitle className="text-xl font-bold">Organizational Directory</CardTitle>
                            <CardDescription>Manage user roles, departments, and administrative privileges.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-muted/10">
                                    <TableRow className="hover:bg-transparent border-border/50">
                                        <TableHead className="px-6">User / Identity</TableHead>
                                        <TableHead>Department</TableHead>
                                        <TableHead>Operational Role</TableHead>
                                        <TableHead>Access Level</TableHead>
                                        <TableHead className="text-right px-6">Management</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {profiles.map((profile) => (
                                        <TableRow key={profile.user_id} className="group hover:bg-muted/5 border-border/50">
                                            <TableCell className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm tracking-tight">{profile.email || "ANONYMOUS_ENTITY"}</span>
                                                    <span className="text-[10px] text-muted-foreground font-mono opacity-50 uppercase">{profile.user_id}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {editingId === profile.user_id ? (
                                                    <Select
                                                        value={editValues.department}
                                                        onValueChange={(v) => setEditValues(prev => ({ ...prev, department: v }))}
                                                    >
                                                        <SelectTrigger className="w-48 h-9 rounded-lg">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 text-sm font-medium">
                                                        <MapPin className="size-3.5 text-secondary" />
                                                        {profile.department}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {editingId === profile.user_id ? (
                                                    <Select
                                                        value={editValues.job_title}
                                                        onValueChange={(v) => setEditValues(prev => ({ ...prev, job_title: v }))}
                                                    >
                                                        <SelectTrigger className="w-56 h-9 rounded-lg">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {JOB_TITLES.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 text-sm font-medium">
                                                        <Briefcase className="size-3.5 text-primary" />
                                                        {profile.job_title}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {editingId === profile.user_id ? (
                                                    <Button
                                                        variant={editValues.is_admin ? "default" : "outline"}
                                                        size="sm"
                                                        className="h-8 px-3 rounded-lg text-xs font-bold"
                                                        onClick={() => setEditValues(prev => ({ ...prev, is_admin: !prev.is_admin }))}
                                                    >
                                                        {editValues.is_admin ? <Shield className="size-3 mr-1.5" /> : null}
                                                        {editValues.is_admin ? "ADMIN_PRIVILEGED" : "STANDARD_USER"}
                                                    </Button>
                                                ) : (
                                                    <Badge variant={profile.is_admin ? "destructive" : "secondary"} className="gap-1.5 rounded-md px-2 py-0.5 text-[10px] uppercase font-black tracking-widest">
                                                        {profile.is_admin && <Shield className="size-2.5" />}
                                                        {profile.is_admin ? "Administrator" : "User"}
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right px-6">
                                                {editingId === profile.user_id ? (
                                                    <div className="flex justify-end gap-2">
                                                        <Button size="icon" variant="ghost" className="size-9 text-emerald-500 hover:bg-emerald-500/10 rounded-xl" onClick={handleSaveEdit}>
                                                            <Save className="size-4" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="size-9 text-muted-foreground rounded-xl" onClick={handleCancelEdit}>
                                                            <X className="size-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-end gap-2">
                                                        <Button size="icon" variant="ghost" className="size-9 opacity-0 group-hover:opacity-100 transition-all rounded-xl hover:bg-primary/10 hover:text-primary" onClick={() => handleStartEdit(profile)}>
                                                            <Edit2 className="size-4" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="size-9 opacity-0 group-hover:opacity-100 transition-all rounded-xl hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDeleteUser(profile.user_id, profile.email || "ANONYMOUS")}>
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="personas">
                    <PersonaManagement />
                </TabsContent>
            </Tabs>
        </div>
    );
}
