/**
 * Organization-Aware Agent Types
 * Based on the 5-category hierarchy framework for GOEIC
 */

/**
 * The 5 agent archetypes from the organizational hierarchy image
 * وكلاء المستخدمين
 */
export type AgentArchetype =
    | "org_manager"      // وكيل مدير المؤسسة
    | "dept_manager"     // وكيل لكل إدارة
    | "decision_support" // وكيل مساعد اتخاذ القرار
    | "compliance"       // وكيل أمان وامتثال
    | "workgroup";       // وكيل مجموعة عمل مخصص

export const AGENT_ARCHETYPE_LABELS: Record<AgentArchetype, { ar: string; en: string; description: string }> = {
    org_manager: {
        ar: "وكيل مدير المؤسسة",
        en: "Organization Manager Agent",
        description: "يمتلك رؤية شاملة لكل الهيئة، يساعد في القرارات الاستراتيجية والتقارير العليا",
    },
    dept_manager: {
        ar: "وكيل لكل إدارة",
        en: "Department Manager Agent",
        description: "متخصص في إدارة بعينها، يعرف مهامها وأهدافها ومؤشرات أدائها",
    },
    decision_support: {
        ar: "وكيل مساعد اتخاذ القرار",
        en: "Decision Support Agent",
        description: "يحلل البيانات ويقدم توصيات مبنية على الأدلة لدعم القرارات",
    },
    compliance: {
        ar: "وكيل أمان وامتثال",
        en: "Compliance & Security Agent",
        description: "يراقب الامتثال للوائح والسياسات ويضمن الالتزام بالمعايير",
    },
    workgroup: {
        ar: "وكيل مجموعة عمل مخصص",
        en: "Specialized Workgroup Agent",
        description: "وكيل متخصص لمهمة أو مشروع محدد داخل الهيئة",
    },
};

/**
 * Hierarchy levels within the organization
 */
export type HierarchyLevel = 1 | 2 | 3;
export const HIERARCHY_LEVEL_LABELS: Record<HierarchyLevel, { ar: string; en: string }> = {
    1: { ar: "مستوى المؤسسة", en: "Organization Level" },
    2: { ar: "مستوى الإدارة", en: "Department Level" },
    3: { ar: "مستوى الوظيفة", en: "Role Level" },
};

/**
 * البيانات الرئيسية للمؤسسة - Organization Core Data
 */
export interface OrganizationData {
    id: string;
    name_ar: string;
    name_en: string;
    short_name: string;
    logo_url?: string;
    established_year: number;
    parent_ministry_ar: string;
    parent_ministry_en: string;
    description_ar: string;
    vision_ar: string;
    mission_ar: string;
    goals: string[];
    values: string[];
    annual_plan_summary: string;
    general_policies: string[];
    website: string;
}

/**
 * بيانات الهيكل المؤسسي - Organizational Structure
 */
export interface OrgDepartment {
    id: string;
    name_ar: string;
    name_en: string;
    description_ar: string;
    manager_title_ar: string;
    job_titles: OrgJobTitle[];
    rag_collection: string; // The RAG collection for this department's documents
    kpis: string[];
    delegation_level: 1 | 2 | 3; // 1=high authority, 3=operational
}

export interface OrgJobTitle {
    title_ar: string;
    title_en: string;
    description_ar: string;
    requirements: string[];
    kpis: string[];
    hierarchy_level: HierarchyLevel;
}

/**
 * الأصول المعرفية - Knowledge Assets (RAG Collections)
 */
export interface KnowledgeAsset {
    collection_id: string;
    name_ar: string;
    name_en: string;
    type: "official_docs" | "laws" | "internal_regulations" | "meeting_records" | "digital_registry";
    scope: "org" | "dept" | "role";
    department_id?: string;
}

/**
 * Extended Persona with org-aware fields
 * الوكلاء - Agent configuration per role
 */
export interface OrgPersona {
    job_title: string;
    persona_text: string;
    goals: string[];
    rag_context: string;
    rag_collections: string[]; // Multiple collections: org + dept + role
    capabilities: string[];
    tools?: string[];
    assigned_agent_id?: string;
    assigned_deployment_id?: string;
    // New org-aware fields
    agent_type?: AgentArchetype;
    hierarchy_level?: HierarchyLevel;
    department?: string; // department id this persona belongs to
}

/**
 * الموارد البشرية - Extended User Profile
 */
export interface OrgUserProfile {
    user_id: string;
    department: string;
    job_title: string;
    hierarchy_level?: HierarchyLevel;
    manager_user_id?: string;
    skills?: string[];
    qualifications?: string[];
    assigned_agent_id?: string;
    assigned_deployment_id?: string;
    is_admin?: boolean;
}
