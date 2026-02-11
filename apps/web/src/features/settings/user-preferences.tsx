"use client";

import React, { useEffect, useState } from "react";
import { useUserSettings } from "@/hooks/use-user-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
    Settings2,
    Plus,
    Trash2,
    RefreshCw,
    Save,
    Globe,
    Palette,
    Bell,
    Database
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export function UserPreferences() {
    const { settings, loading, fetchSettings, updateSetting, deleteSetting } = useUserSettings();
    const [newKey, setNewKey] = useState("");
    const [newValue, setNewValue] = useState("");
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newKey || !newValue) {
            toast.error("Both key and value are required");
            return;
        }
        setIsAdding(true);
        await updateSetting({ key: newKey, value: newValue });
        setNewKey("");
        setNewValue("");
        setIsAdding(false);
    };

    const commonSettings = [
        { key: "theme", label: "Theme", icon: <Palette className="size-4" />, description: "Light, Dark, or System" },
        { key: "language", label: "Language", icon: <Globe className="size-4" />, description: "Preferred interface language" },
        { key: "notifications", label: "Notifications", icon: <Bell className="size-4" />, description: "Enable or disable alerts" },
        { key: "data_persistence", label: "Data Persistence", icon: <Database className="size-4" />, description: "How long to keep local data" },
    ];

    return (
        <div className="flex flex-col gap-8 anime-fade-in">
            {/* Header Section */}
            <div className="flex items-center justify-between glass-card p-6 rounded-2xl neon-border-secondary relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-secondary/10 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 flex items-center gap-4">
                    <div className="p-3 bg-secondary/10 rounded-xl neon-border-secondary">
                        <Settings2 className="size-8 text-secondary drop-shadow-[0_0_15px_rgba(var(--secondary),0.5)]" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter bg-gradient-to-r from-secondary via-primary to-orange-600 bg-clip-text text-transparent">
                            User Preferences
                        </h1>
                        <p className="text-foreground/50 font-medium font-mono uppercase text-[10px] tracking-widest">Database Synchronized Settings</p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchSettings()}
                    disabled={loading}
                    className="border-secondary/20 hover:bg-secondary/10"
                >
                    <RefreshCw className={`size-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                    Sync
                </Button>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Quick Settings */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <Card className="glass-card neon-border-secondary border-none h-fit">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Plus className="size-4 text-secondary" />
                                Add New Configuration
                            </CardTitle>
                            <CardDescription>Register a custom setting in the Gorbit cloud.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAdd} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="setting-key" className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Key Identifier</Label>
                                    <Input
                                        id="setting-key"
                                        placeholder="e.g., ai_model_preference"
                                        value={newKey}
                                        onChange={(e) => setNewKey(e.target.value)}
                                        className="bg-muted/20 border-secondary/10 focus:border-secondary/50 transition-all font-mono text-xs"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="setting-value" className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Store Value</Label>
                                    <Input
                                        id="setting-value"
                                        placeholder="Enter value..."
                                        value={newValue}
                                        onChange={(e) => setNewValue(e.target.value)}
                                        className="bg-muted/20 border-secondary/10 focus:border-secondary/50 transition-all font-mono text-xs"
                                    />
                                </div>
                                <Button type="submit" className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground shadow-lg shadow-secondary/20" disabled={isAdding}>
                                    {isAdding ? <RefreshCw className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />}
                                    Save to Database
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="glass-card border-none bg-muted/10 h-fit">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold">Common Schema</CardTitle>
                            <CardDescription className="text-[10px]">Pre-defined Gorbit parameters</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-2">
                            {commonSettings.map((item) => (
                                <div
                                    key={item.key}
                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 cursor-pointer transition-colors group"
                                    onClick={() => {
                                        setNewKey(item.key);
                                        const existing = settings.find(s => s.key === item.key);
                                        if (existing) setNewValue(typeof existing.value === 'string' ? existing.value : JSON.stringify(existing.value));
                                    }}
                                >
                                    <div className="p-2 bg-background/50 rounded-md border border-border group-hover:border-secondary/50 group-hover:text-secondary transition-colors">
                                        {item.icon}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-semibold">{item.label}</span>
                                        <span className="text-[9px] text-muted-foreground line-clamp-1">{item.description}</span>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Settings Table */}
                <Card className="lg:col-span-2 glass-card neon-border-secondary border-none overflow-hidden h-fit">
                    <CardHeader className="border-b border-border/10 bg-muted/5">
                        <CardTitle className="text-xl font-black">Configuration Overview</CardTitle>
                        <CardDescription>Real-time view of your synchronized parameters.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading && settings.length === 0 ? (
                            <div className="p-8 space-y-4">
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                            </div>
                        ) : settings.length > 0 ? (
                            <Table>
                                <TableHeader className="bg-muted/30">
                                    <TableRow className="border-border/10 hover:bg-transparent">
                                        <TableHead className="w-[200px] text-xs font-bold uppercase tracking-widest text-muted-foreground pl-6">Key</TableHead>
                                        <TableHead className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Value</TableHead>
                                        <TableHead className="text-right text-xs font-bold uppercase tracking-widest text-muted-foreground pr-6">Management</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {settings.map((setting) => (
                                        <TableRow key={setting.key} className="border-border/5 hover:bg-muted/20 transition-colors group">
                                            <TableCell className="pl-6">
                                                <div className="flex flex-col gap-1">
                                                    <code className="text-xs font-mono font-bold text-secondary">{setting.key}</code>
                                                    <span className="text-[9px] text-muted-foreground">Last updated: {new Date(setting.updated_at).toLocaleDateString()}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-mono text-[10px] bg-background/50 border-secondary/10">
                                                    {typeof setting.value === 'object' ? JSON.stringify(setting.value) : String(setting.value)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8 hover:bg-secondary/10 hover:text-secondary"
                                                        onClick={() => {
                                                            setNewKey(setting.key);
                                                            setNewValue(typeof setting.value === 'string' ? setting.value : JSON.stringify(setting.value));
                                                        }}
                                                    >
                                                        <Settings2 className="size-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8 hover:bg-destructive/10 hover:text-destructive"
                                                        onClick={() => deleteSetting(setting.key)}
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-50">
                                <Database className="size-16 mb-4 stroke-[1]" />
                                <p className="font-medium">No server-side settings established.</p>
                                <p className="text-xs">Add a key above to initialize synchronization.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
