"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
    Users, Shield, MapPin, Briefcase, X, Edit2, Save, Brain, Trash2,
    Building2, PlusCircle, RefreshCw, Loader2,
} from "lucide-react";
import { OrgDashboard } from "@/features/organization/OrgDashboard";
import { useOrganizationContext } from "@/providers/Organization";
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { PersonaManagement } from "./components/PersonaManagement";
import {
    fetchOrgUserProfiles, upsertOrgUserProfile, deleteOrgUserProfile,
    type OrgUserProfile,
} from "@/lib/org-api";

// ─── Types ────────────────────────────────────────────────────────────────────

type EditDraft = OrgUserProfile;

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminInterface() {
    const { departments } = useOrganizationContext();

    // ── State ─────────────────────────────────────────────────────────────────
    const [profiles, setProfiles] = useState<OrgUserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<Partial<EditDraft>>({});
    const [saving, setSaving] = useState(false);

    // Add-new dialog
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [newUser, setNewUser] = useState<Partial<OrgUserProfile>>({
        email: "",
        department: "",
        department_id: null,
        job_title: "",
        hierarchy_level: null,
        is_admin: false,
    });
    const [addingUser, setAddingUser] = useState(false);

    // ── Derived org options from Supabase departments ─────────────────────────

    /** Per-department job title lists, filtered when dept is selected */
    const jobTitlesForDept = useMemo(() => {
        const deptId = editValues.department_id
            ?? departments.find(d => d.name_ar === editValues.department)?.id;
        if (!deptId) {
            return departments.flatMap(d => (d.job_titles ?? []).map((jt: any) => jt.title_ar)).filter(Boolean);
        }
        const dept = departments.find(d => d.id === deptId);
        return (dept?.job_titles ?? []).map((jt: any) => jt.title_ar).filter(Boolean);
    }, [departments, editValues.department_id, editValues.department]);

    const jobTitlesForNew = useMemo(() => {
        const dept = departments.find(d => d.id === newUser.department_id);
        if (!dept) return departments.flatMap(d => (d.job_titles ?? []).map((jt: any) => jt.title_ar)).filter(Boolean);
        return (dept.job_titles ?? []).map((jt: any) => jt.title_ar).filter(Boolean);
    }, [departments, newUser.department_id]);

    // ── Fetch from Supabase ───────────────────────────────────────────────────

    const loadProfiles = async () => {
        setIsLoading(true);
        try {
            const data = await fetchOrgUserProfiles();
            setProfiles(data);
        } catch (err) {
            console.error(err);
            toast.error("فشل تحميل بيانات المستخدمين من قاعدة البيانات");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { loadProfiles(); }, []);

    // ── Edit helpers ──────────────────────────────────────────────────────────

    const handleStartEdit = (profile: OrgUserProfile) => {
        setEditingId(profile.user_id);
        setEditValues({ ...profile });
    };

    const handleCancelEdit = () => { setEditingId(null); setEditValues({}); };

    const handleSaveEdit = async () => {
        if (!editingId) return;
        setSaving(true);
        try {
            // Resolve department_id from name if not set
            const deptId = editValues.department_id
                ?? departments.find(d => d.name_ar === editValues.department)?.id
                ?? null;

            const hierLevel = deptId
                ? departments.find(d => d.id === deptId)?.job_titles
                    ?.find((jt: any) => jt.title_ar === editValues.job_title)
                    ?.hierarchy_level ?? null
                : null;

            await upsertOrgUserProfile({
                user_id: editingId,
                email: editValues.email ?? null,
                department: editValues.department ?? null,
                department_id: deptId,
                job_title: editValues.job_title ?? null,
                hierarchy_level: hierLevel,
                is_admin: editValues.is_admin ?? false,
                ...(editValues.id ? { id: editValues.id } : {}),
            });

            toast.success("تم حفظ بيانات المستخدم في قاعدة البيانات ✅");
            setEditingId(null);
            await loadProfiles();
        } catch (err) {
            console.error(err);
            toast.error("فشل الحفظ");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (userId: string, email: string | null) => {
        if (!confirm(`هل أنت متأكد من حذف المستخدم "${email ?? userId}"؟`)) return;
        try {
            await deleteOrgUserProfile(userId);
            toast.success("تم حذف المستخدم");
            await loadProfiles();
        } catch (err) {
            console.error(err);
            toast.error("فشل الحذف");
        }
    };

    // ── Add new user ──────────────────────────────────────────────────────────

    const handleAddUser = async () => {
        if (!newUser.user_id && !newUser.email) {
            toast.error("يجب إدخال User ID أو البريد الإلكتروني");
            return;
        }
        setAddingUser(true);
        try {
            const deptId = newUser.department_id ?? null;
            const hierLevel = deptId
                ? departments.find(d => d.id === deptId)?.job_titles
                    ?.find((jt: any) => jt.title_ar === newUser.job_title)
                    ?.hierarchy_level ?? null
                : null;

            await upsertOrgUserProfile({
                user_id: newUser.user_id!,
                email: newUser.email || null,
                department: departments.find(d => d.id === deptId)?.name_ar ?? null,
                department_id: deptId,
                job_title: newUser.job_title || null,
                hierarchy_level: hierLevel,
                is_admin: newUser.is_admin ?? false,
            });

            toast.success("تم إضافة المستخدم إلى org_user_profiles ✅");
            setShowAddDialog(false);
            setNewUser({ email: "", department: "", department_id: null, job_title: "", hierarchy_level: null, is_admin: false });
            await loadProfiles();
        } catch (err) {
            console.error(err);
            toast.error("فشلت إضافة المستخدم");
        } finally {
            setAddingUser(false);
        }
    };

    // ── When dept changes in edit row, filter job titles ─────────────────────
    const handleEditDeptChange = (deptAr: string) => {
        const dept = departments.find(d => d.name_ar === deptAr);
        setEditValues(prev => ({
            ...prev,
            department: deptAr,
            department_id: dept?.id ?? null,
            job_title: "", // reset job title on dept change
        }));
    };

    const handleNewDeptChange = (deptId: string) => {
        const dept = departments.find(d => d.id === deptId);
        setNewUser(prev => ({
            ...prev,
            department_id: deptId,
            department: dept?.name_ar ?? "",
            job_title: "",
        }));
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="flex w-full flex-col gap-8 p-10 max-w-7xl mx-auto transition-all">
            <header className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-500/10 rounded-2xl text-red-500 ring-1 ring-red-500/20">
                        <Shield className="size-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter uppercase italic">Control Center</h1>
                        <p className="text-muted-foreground font-medium">Administrative control and organizational configuration.</p>
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
                    <TabsTrigger value="organization" className="rounded-lg gap-2 px-6">
                        <Building2 className="size-4" /> Organization
                    </TabsTrigger>
                </TabsList>

                {/* ══════════════ USERS TAB ══════════════ */}
                <TabsContent value="users">
                    <Card className="border-none glass-card shadow-2xl overflow-hidden">
                        <CardHeader className="bg-muted/20 pb-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-xl font-bold" dir="rtl">الدليل التنظيمي</CardTitle>
                                    <CardDescription dir="rtl">
                                        إدارة الموظفين وربطهم بإداراتهم ومسمياتهم الوظيفية — البيانات من{" "}
                                        <code className="text-xs bg-muted rounded px-1">org_user_profiles</code>
                                    </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="gap-2" onClick={loadProfiles} disabled={isLoading}>
                                        <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
                                        تحديث
                                    </Button>
                                    <Button size="sm" className="gap-2" onClick={() => setShowAddDialog(true)}>
                                        <PlusCircle className="size-4" />
                                        إضافة موظف
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-0">
                            {isLoading ? (
                                <div className="p-6 space-y-3">
                                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
                                </div>
                            ) : profiles.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3" dir="rtl">
                                    <Users className="size-12 opacity-20" />
                                    <p className="font-medium">لا يوجد موظفون مسجلون بعد</p>
                                    <p className="text-sm opacity-60">استخدم زر "إضافة موظف" لإضافة أول موظف</p>
                                    <Button variant="outline" className="mt-2 gap-2" onClick={() => setShowAddDialog(true)}>
                                        <PlusCircle className="size-4" /> إضافة موظف
                                    </Button>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader className="bg-muted/10">
                                        <TableRow className="hover:bg-transparent border-border/50">
                                            <TableHead className="px-6">المستخدم</TableHead>
                                            <TableHead>الإدارة</TableHead>
                                            <TableHead>المسمى الوظيفي</TableHead>
                                            <TableHead>الصلاحية</TableHead>
                                            <TableHead className="text-right px-6">الإجراءات</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {profiles.map((profile) => (
                                            <TableRow key={profile.user_id} className="group hover:bg-muted/5 border-border/50">
                                                {/* Identity */}
                                                <TableCell className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-sm tracking-tight">
                                                            {profile.email || "مستخدم مجهول"}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground font-mono opacity-50">
                                                            {profile.user_id}
                                                        </span>
                                                    </div>
                                                </TableCell>

                                                {/* Department */}
                                                <TableCell>
                                                    {editingId === profile.user_id ? (
                                                        <Select
                                                            value={editValues.department ?? ""}
                                                            onValueChange={handleEditDeptChange}
                                                        >
                                                            <SelectTrigger className="w-52 h-9 rounded-lg">
                                                                <SelectValue placeholder="اختر الإدارة" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {departments.map(d => (
                                                                    <SelectItem key={d.id} value={d.name_ar}>{d.name_ar}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5 text-sm font-medium">
                                                            <MapPin className="size-3.5 text-secondary shrink-0" />
                                                            <span>{profile.department ?? "—"}</span>
                                                        </div>
                                                    )}
                                                </TableCell>

                                                {/* Job Title */}
                                                <TableCell>
                                                    {editingId === profile.user_id ? (
                                                        <Select
                                                            value={editValues.job_title ?? ""}
                                                            onValueChange={(v) => setEditValues(prev => ({ ...prev, job_title: v }))}
                                                        >
                                                            <SelectTrigger className="w-60 h-9 rounded-lg">
                                                                <SelectValue placeholder="اختر المسمى" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {jobTitlesForDept.map(j => (
                                                                    <SelectItem key={j} value={j}>{j}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5 text-sm font-medium">
                                                            <Briefcase className="size-3.5 text-primary shrink-0" />
                                                            <span>{profile.job_title ?? "—"}</span>
                                                        </div>
                                                    )}
                                                </TableCell>

                                                {/* Admin toggle */}
                                                <TableCell>
                                                    {editingId === profile.user_id ? (
                                                        <Button
                                                            variant={editValues.is_admin ? "default" : "outline"}
                                                            size="sm"
                                                            className="h-8 px-3 rounded-lg text-xs font-bold"
                                                            onClick={() => setEditValues(prev => ({ ...prev, is_admin: !prev.is_admin }))}
                                                        >
                                                            {editValues.is_admin && <Shield className="size-3 mr-1.5" />}
                                                            {editValues.is_admin ? "مسؤول" : "مستخدم"}
                                                        </Button>
                                                    ) : (
                                                        <Badge
                                                            variant={profile.is_admin ? "destructive" : "secondary"}
                                                            className="gap-1.5 rounded-md px-2 py-0.5 text-[10px] uppercase font-black tracking-widest"
                                                        >
                                                            {profile.is_admin && <Shield className="size-2.5" />}
                                                            {profile.is_admin ? "Administrator" : "User"}
                                                        </Badge>
                                                    )}
                                                </TableCell>

                                                {/* Actions */}
                                                <TableCell className="text-right px-6">
                                                    {editingId === profile.user_id ? (
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="size-9 text-emerald-500 hover:bg-emerald-500/10 rounded-xl"
                                                                onClick={handleSaveEdit}
                                                                disabled={saving}
                                                            >
                                                                {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                                                            </Button>
                                                            <Button size="icon" variant="ghost" className="size-9 text-muted-foreground rounded-xl" onClick={handleCancelEdit}>
                                                                <X className="size-4" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                size="icon" variant="ghost"
                                                                className="size-9 opacity-0 group-hover:opacity-100 transition-all rounded-xl hover:bg-primary/10 hover:text-primary"
                                                                onClick={() => handleStartEdit(profile)}
                                                            >
                                                                <Edit2 className="size-4" />
                                                            </Button>
                                                            <Button
                                                                size="icon" variant="ghost"
                                                                className="size-9 opacity-0 group-hover:opacity-100 transition-all rounded-xl hover:bg-destructive/10 hover:text-destructive"
                                                                onClick={() => handleDelete(profile.user_id, profile.email)}
                                                            >
                                                                <Trash2 className="size-4" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ══════════════ AI PERSONAS TAB ══════════════ */}
                <TabsContent value="personas">
                    <PersonaManagement />
                </TabsContent>

                {/* ══════════════ ORGANIZATION TAB ══════════════ */}
                <TabsContent value="organization">
                    <OrgDashboard />
                </TabsContent>
            </Tabs>

            {/* ── Add User Dialog ───────────────────────────────────────────────── */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent className="glass-card border-none max-w-md" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black">إضافة موظف</DialogTitle>
                        <DialogDescription>
                            أدخل بيانات الموظف ليظهر في الهيكل التنظيمي.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {/* User ID (UUID) */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                                User ID (UUID من auth.users)
                            </label>
                            <Input
                                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                value={newUser.user_id ?? ""}
                                onChange={e => setNewUser(p => ({ ...p, user_id: e.target.value }))}
                                className="font-mono text-xs"
                                dir="ltr"
                            />
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                                البريد الإلكتروني
                            </label>
                            <Input
                                placeholder="user@goeic.gov.eg"
                                value={newUser.email ?? ""}
                                onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))}
                                dir="ltr"
                            />
                        </div>

                        {/* Department */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                                الإدارة
                            </label>
                            <Select
                                value={newUser.department_id ?? ""}
                                onValueChange={handleNewDeptChange}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="اختر الإدارة" />
                                </SelectTrigger>
                                <SelectContent>
                                    {departments.map(d => (
                                        <SelectItem key={d.id} value={d.id}>{d.name_ar}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Job Title — filtered by selected dept */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                                المسمى الوظيفي
                            </label>
                            <Select
                                value={newUser.job_title ?? ""}
                                onValueChange={v => setNewUser(p => ({ ...p, job_title: v }))}
                                disabled={jobTitlesForNew.length === 0}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder={jobTitlesForNew.length === 0 ? "اختر الإدارة أولاً" : "اختر المسمى"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {jobTitlesForNew.map(j => (
                                        <SelectItem key={j} value={j}>{j}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Admin */}
                        <div className="flex items-center justify-between pt-1">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                                منح صلاحية المسؤول
                            </label>
                            <Button
                                variant={newUser.is_admin ? "default" : "outline"}
                                size="sm"
                                className="h-8 px-4 rounded-lg text-xs font-bold gap-2"
                                onClick={() => setNewUser(p => ({ ...p, is_admin: !p.is_admin }))}
                            >
                                {newUser.is_admin && <Shield className="size-3" />}
                                {newUser.is_admin ? "مسؤول" : "مستخدم عادي"}
                            </Button>
                        </div>
                    </div>

                    <DialogFooter className="flex gap-2" dir="ltr">
                        <Button variant="outline" onClick={() => setShowAddDialog(false)}>إلغاء</Button>
                        <Button onClick={handleAddUser} disabled={addingUser} className="gap-2">
                            {addingUser ? <Loader2 className="size-4 animate-spin" /> : <PlusCircle className="size-4" />}
                            إضافة
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
