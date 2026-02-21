/**
 * Mock Organization Data — GOEIC
 * الهيئة العامة للرقابة على الصادرات والواردات
 *
 * This is sample/mock data for development and demonstration purposes.
 * In production, this would be fetched from the backend API.
 */

import type {
    OrganizationData,
    OrgDepartment,
    KnowledgeAsset,
    OrgPersona,
} from "@/types/organization";

// ─────────────────────────────────────────────────────────────────────────────
// البيانات الرئيسية للمؤسسة — Organization Core Data
// ─────────────────────────────────────────────────────────────────────────────
export const MOCK_ORGANIZATION: OrganizationData = {
    id: "goeic-001",
    name_ar: "الهيئة العامة للرقابة على الصادرات والواردات",
    name_en: "General Organization for Export and Import Control",
    short_name: "GOEIC",
    established_year: 1971,
    parent_ministry_ar: "وزارة الاستثمار والتجارة الخارجية",
    parent_ministry_en: "Ministry of Investment and Foreign Trade",
    description_ar:
        "هيئة خدمية حكومية تأسست عام 1971 بموجب قرار رئيس الجمهورية رقم 1770، تعمل على حماية المستهلك والمحافظة على سمعة مصر من خلال فحص الصادرات والواردات السلعية بأحدث الأساليب والتجهيزات العلمية.",
    vision_ar:
        "أن تكون الهيئة مرجعاً وطنياً رائداً في مجال الرقابة على جودة الصادرات والواردات، معترفاً بها دولياً، وداعمةً لتنافسية الصادرات المصرية في الأسواق العالمية.",
    mission_ar:
        "حماية المستهلك والمحافظة على سمعة مصر من خلال الرقابة النوعية على الصادرات والواردات السلعية، وتيسير حركة التجارة الخارجية، وتنمية وتشجيع الصادرات المصرية.",
    goals: [
        "تطبيق الرقابة النوعية على الصادرات والواردات وفق المعايير الدولية",
        "إعداد الإحصائيات والتقارير المتعلقة بحركة التجارة الخارجية",
        "تطوير الصناعات المصرية وزيادة قدرتها التنافسية في الأسواق العالمية",
        "إنشاء وتطوير المعامل الحديثة وتزويدها بأحدث الوسائل الفنية",
        "إصدار شهادات المنشأ للسلع المصرية",
        "توعية المصدرين وتقديم الإرشادات اللازمة لتيسير الصادرات",
        "تسجيل المصدرين والمستوردين والوكلاء التجاريين",
    ],
    values: [
        "الجودة والتميز",
        "الشفافية والنزاهة",
        "الكفاءة والفاعلية",
        "خدمة المجتمع",
        "الاحترافية والمهنية",
        "الابتكار والتطوير المستمر",
    ],
    annual_plan_summary:
        "خطة 2025-2026 تركز على: رقمنة خدمات الهيئة، توسيع شبكة المعامل المعتمدة، تعزيز الشراكات الدولية، وتطوير منظومة شهادات المنشأ الإلكترونية.",
    general_policies: [
        "سياسة الجودة: الالتزام بأعلى معايير الجودة في جميع الخدمات والعمليات",
        "سياسة الخصوصية: حماية بيانات العملاء والمتعاملين",
        "سياسة مكافحة الفساد: الصفر تسامح مع الفساد والرشوة",
        "سياسة الاستدامة: تقليل البصمة البيئية وتعزيز الممارسات المستدامة",
        "سياسة التدريب والتطوير: الاستثمار المستمر في تطوير الكوادر البشرية",
    ],
    website: "https://www.goeic.gov.eg",
};

// ─────────────────────────────────────────────────────────────────────────────
// بيانات الهيكل المؤسسي — Organizational Structure
// ─────────────────────────────────────────────────────────────────────────────
export const MOCK_DEPARTMENTS: OrgDepartment[] = [
    {
        id: "dept-presidency",
        name_ar: "مكتب رئيس الهيئة",
        name_en: "Office of the Chairman",
        description_ar: "الإدارة العليا للهيئة، تشرف على جميع القطاعات وتضع السياسات الاستراتيجية",
        manager_title_ar: "رئيس الهيئة",
        delegation_level: 1,
        rag_collection: "goeic_presidency_docs",
        kpis: [
            "نسبة تحقيق الأهداف الاستراتيجية السنوية",
            "مستوى رضا المتعاملين الخارجيين",
            "عدد الاتفاقيات الدولية المبرمة",
        ],
        job_titles: [
            {
                title_ar: "رئيس الهيئة",
                title_en: "Chairman",
                description_ar: "يتولى الإشراف العام على الهيئة ويمثلها أمام الجهات الحكومية والدولية",
                requirements: ["خبرة لا تقل عن 20 سنة في مجال التجارة الخارجية", "مؤهل علمي عالٍ"],
                kpis: ["تحقيق الخطة الاستراتيجية", "تمثيل الهيئة دولياً"],
                hierarchy_level: 1,
            },
            {
                title_ar: "مستشار رئيس الهيئة",
                title_en: "Chairman's Advisor",
                description_ar: "يقدم المشورة الفنية والقانونية لرئيس الهيئة",
                requirements: ["خبرة متخصصة في مجال التجارة أو القانون"],
                kpis: ["جودة التقارير والمذكرات المقدمة"],
                hierarchy_level: 2,
            },
        ],
    },
    {
        id: "dept-exports",
        name_ar: "الإدارة المركزية لشؤون الصادرات والمنشأ",
        name_en: "Central Administration for Export Affairs & Origin",
        description_ar:
            "تختص بالإشراف على أنشطة الصادرات ومتابعة أعمال الفحص والترخيص للرسائل المصدرة، وإصدار شهادات المنشأ",
        manager_title_ar: "رئيس الإدارة المركزية للصادرات",
        delegation_level: 2,
        rag_collection: "goeic_exports_docs",
        kpis: [
            "عدد شهادات المنشأ الصادرة شهرياً",
            "متوسط وقت إصدار الشهادة",
            "نسبة الرسائل المفحوصة في الوقت المحدد",
            "معدل الشكاوى المتعلقة بالصادرات",
        ],
        job_titles: [
            {
                title_ar: "رئيس الإدارة المركزية للصادرات",
                title_en: "Head of Central Exports Administration",
                description_ar: "يشرف على جميع عمليات فحص الصادرات وإصدار شهادات المنشأ",
                requirements: ["خبرة 15 سنة في مجال الصادرات", "إلمام بالاتفاقيات التجارية الدولية"],
                kpis: ["معدل إنجاز شهادات المنشأ", "رضا المصدرين"],
                hierarchy_level: 2,
            },
            {
                title_ar: "مفتش صادرات",
                title_en: "Export Inspector",
                description_ar: "يقوم بفحص السلع المصدرة والتحقق من مطابقتها للمواصفات",
                requirements: ["مؤهل علمي في الهندسة أو العلوم", "خبرة في مجال الفحص والاختبار"],
                kpis: ["عدد الرسائل المفحوصة يومياً", "دقة نتائج الفحص"],
                hierarchy_level: 3,
            },
            {
                title_ar: "أخصائي شهادات المنشأ",
                title_en: "Certificate of Origin Specialist",
                description_ar: "يتولى إصدار ومراجعة شهادات المنشأ التفضيلية وغير التفضيلية",
                requirements: ["إلمام بقواعد المنشأ الدولية", "خبرة في الاتفاقيات التجارية"],
                kpis: ["دقة الشهادات الصادرة", "سرعة الإنجاز"],
                hierarchy_level: 3,
            },
        ],
    },
    {
        id: "dept-imports",
        name_ar: "الإدارة العامة لشؤون الواردات",
        name_en: "General Administration for Import Affairs",
        description_ar: "تشرف على فحص الواردات والتحقق من مطابقتها للمواصفات والاشتراطات المصرية",
        manager_title_ar: "مدير عام شؤون الواردات",
        delegation_level: 2,
        rag_collection: "goeic_imports_docs",
        kpis: [
            "عدد رسائل الواردات المفحوصة",
            "نسبة الرسائل المرفوضة لعدم المطابقة",
            "متوسط وقت الإفراج الجمركي",
        ],
        job_titles: [
            {
                title_ar: "مدير عام الواردات",
                title_en: "Director General of Imports",
                description_ar: "يشرف على جميع عمليات فحص الواردات وإجراءات الإفراج الجمركي",
                requirements: ["خبرة 12 سنة في مجال الواردات والجمارك"],
                kpis: ["كفاءة منظومة فحص الواردات", "تقليل أوقات الانتظار"],
                hierarchy_level: 2,
            },
            {
                title_ar: "مفتش واردات",
                title_en: "Import Inspector",
                description_ar: "يفحص الواردات ويتحقق من مطابقتها للمواصفات المصرية والدولية",
                requirements: ["مؤهل علمي متخصص", "خبرة في الفحص والاختبار"],
                kpis: ["عدد الرسائل المفحوصة", "دقة نتائج الفحص"],
                hierarchy_level: 3,
            },
        ],
    },
    {
        id: "dept-labs",
        name_ar: "قطاع المعامل",
        name_en: "Laboratories Sector",
        description_ar:
            "يضم شبكة من المعامل المعتمدة (الصناعية، الغذائية، الكيميائية) موزعة على كافة الموانئ المصرية",
        manager_title_ar: "رئيس قطاع المعامل",
        delegation_level: 2,
        rag_collection: "goeic_labs_docs",
        kpis: [
            "عدد الاختبارات المنجزة شهرياً",
            "نسبة الاعتمادات الدولية للمعامل",
            "دقة نتائج الاختبارات",
            "متوسط وقت إصدار تقارير الاختبار",
        ],
        job_titles: [
            {
                title_ar: "رئيس قطاع المعامل",
                title_en: "Head of Laboratories Sector",
                description_ar: "يشرف على جميع المعامل ويضمن جودة الاختبارات والاعتمادات الدولية",
                requirements: ["دكتوراه في العلوم أو الهندسة", "خبرة 15 سنة في مجال المعامل"],
                kpis: ["الحفاظ على الاعتمادات الدولية", "جودة نتائج الاختبارات"],
                hierarchy_level: 2,
            },
            {
                title_ar: "كيميائي معمل",
                title_en: "Laboratory Chemist",
                description_ar: "يجري الاختبارات الكيميائية والفيزيائية على العينات",
                requirements: ["بكالوريوس كيمياء أو علوم", "خبرة في تشغيل الأجهزة الحديثة"],
                kpis: ["عدد الاختبارات المنجزة", "دقة النتائج"],
                hierarchy_level: 3,
            },
        ],
    },
    {
        id: "dept-registration",
        name_ar: "إدارة السجلات التجارية",
        name_en: "Commercial Registries Administration",
        description_ar:
            "تتولى تسجيل المصدرين والمستوردين والوكلاء التجاريين والمكاتب العلمية والاستشارية",
        manager_title_ar: "مدير إدارة السجلات التجارية",
        delegation_level: 2,
        rag_collection: "goeic_registration_docs",
        kpis: [
            "عدد التسجيلات الجديدة شهرياً",
            "متوسط وقت إتمام التسجيل",
            "نسبة التسجيلات الإلكترونية",
        ],
        job_titles: [
            {
                title_ar: "مدير إدارة السجلات",
                title_en: "Director of Registries",
                description_ar: "يشرف على عمليات تسجيل المصدرين والمستوردين والوكلاء",
                requirements: ["خبرة 10 سنوات في مجال التجارة والتسجيل"],
                kpis: ["كفاءة منظومة التسجيل", "رضا المتعاملين"],
                hierarchy_level: 2,
            },
            {
                title_ar: "أخصائي تسجيل",
                title_en: "Registration Specialist",
                description_ar: "يتولى استقبال طلبات التسجيل ومراجعتها وإتمام إجراءاتها",
                requirements: ["مؤهل قانوني أو تجاري", "إلمام بالأنظمة الإلكترونية"],
                kpis: ["عدد الطلبات المنجزة يومياً", "دقة البيانات المسجلة"],
                hierarchy_level: 3,
            },
        ],
    },
    {
        id: "dept-finance",
        name_ar: "قطاع الشؤون المالية والإدارية",
        name_en: "Finance & Administrative Affairs Sector",
        description_ar: "يتولى الإدارة المالية والإدارية للهيئة، بما يشمل الموارد البشرية والمشتريات",
        manager_title_ar: "رئيس قطاع الشؤون المالية والإدارية",
        delegation_level: 2,
        rag_collection: "goeic_finance_docs",
        kpis: [
            "الالتزام بالميزانية السنوية",
            "نسبة إنجاز المشتريات في الوقت المحدد",
            "معدل دوران الموظفين",
        ],
        job_titles: [
            {
                title_ar: "رئيس قطاع المالية والإدارة",
                title_en: "Head of Finance & Administration",
                description_ar: "يشرف على الشؤون المالية والإدارية وضمان الكفاءة التشغيلية",
                requirements: ["مؤهل محاسبي أو إداري عالٍ", "خبرة 12 سنة في الإدارة المالية الحكومية"],
                kpis: ["الالتزام بالميزانية", "كفاءة العمليات الإدارية"],
                hierarchy_level: 2,
            },
            {
                title_ar: "محاسب",
                title_en: "Accountant",
                description_ar: "يتولى إعداد التقارير المالية ومتابعة الحسابات",
                requirements: ["بكالوريوس تجارة - محاسبة"],
                kpis: ["دقة التقارير المالية", "الالتزام بالمواعيد"],
                hierarchy_level: 3,
            },
            {
                title_ar: "أخصائي موارد بشرية",
                title_en: "HR Specialist",
                description_ar: "يتولى شؤون الموظفين والتوظيف والتدريب",
                requirements: ["مؤهل في إدارة الأعمال أو الموارد البشرية"],
                kpis: ["رضا الموظفين", "إنجاز طلبات الموارد البشرية"],
                hierarchy_level: 3,
            },
        ],
    },
    // ══════════════════════════════════════════════════════════════
    // ▶ مثال عملي كامل: إدارة الشؤون القانونية
    //   يُوضِّح كيف تتكامل: الإدارة ← المسمى الوظيفي ← الشخصية ← الوكيل
    // ══════════════════════════════════════════════════════════════
    {
        id: "dept-legal",
        name_ar: "إدارة الشؤون القانونية",
        name_en: "Legal Affairs Administration",
        description_ar:
            "تتولى متابعة القضايا القانونية للهيئة، ومراجعة العقود والاتفاقيات، وإبداء الرأي القانوني في جميع شؤون الهيئة، والتنسيق مع هيئة قضايا الدولة.",
        manager_title_ar: "مدير إدارة الشؤون القانونية",
        delegation_level: 2,
        rag_collection: "goeic_legal_docs",
        kpis: [
            "عدد القضايا المنظورة والمُنهاة",
            "نسبة العقود المُراجَعة في الوقت المحدد",
            "عدد المذكرات القانونية الصادرة",
            "معدل الفوز في القضايا المرفوعة باسم الهيئة",
        ],
        job_titles: [
            {
                title_ar: "مدير الشؤون القانونية",
                title_en: "Director of Legal Affairs",
                description_ar:
                    "يشرف على جميع الشؤون القانونية للهيئة، ويتابع القضايا المنظورة أمام المحاكم، ويُمثّل الهيئة في النزاعات القانونية",
                requirements: [
                    "بكالوريوس حقوق أو شريعة وقانون",
                    "خبرة لا تقل عن 12 سنة في المجال القانوني",
                    "إلمام بقانون التجارة والاستثمار الدولي",
                ],
                kpis: [
                    "جودة التمثيل القانوني للهيئة",
                    "سرعة الفصل في الاستشارات القانونية",
                ],
                hierarchy_level: 2,
            },
            {
                title_ar: "مستشار قانوني",
                title_en: "Legal Counselor",
                description_ar:
                    "يقدم الاستشارات القانونية في مجالات التشريعات الجمركية والتجارية، ويراجع العقود والمراسلات الرسمية، ويُعدّ المذكرات القانونية",
                requirements: [
                    "بكالوريوس حقوق",
                    "خبرة 5 سنوات على الأقل في القانون التجاري أو الجمركي",
                    "إجادة صياغة العقود والمذكرات القانونية",
                ],
                kpis: [
                    "عدد الاستشارات القانونية المُقدَّمة شهرياً",
                    "دقة المراجعة القانونية للعقود",
                    "الوقت المستغرق في إصدار الرأي القانوني",
                ],
                hierarchy_level: 3,
            },
        ],
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// الأصول المعرفية — Knowledge Assets (RAG Collections)
// ─────────────────────────────────────────────────────────────────────────────
export const MOCK_KNOWLEDGE_ASSETS: KnowledgeAsset[] = [
    {
        collection_id: "goeic_org_docs",
        name_ar: "الوثائق العامة للهيئة",
        name_en: "GOEIC General Documents",
        type: "official_docs",
        scope: "org",
    },
    {
        collection_id: "goeic_laws",
        name_ar: "القوانين واللوائح التجارية",
        name_en: "Trade Laws & Regulations",
        type: "laws",
        scope: "org",
    },
    {
        collection_id: "goeic_internal_regs",
        name_ar: "اللوائح التنظيمية الداخلية",
        name_en: "Internal Organizational Regulations",
        type: "internal_regulations",
        scope: "org",
    },
    {
        collection_id: "goeic_decisions",
        name_ar: "سجل قرارات الهيئة",
        name_en: "GOEIC Decisions Registry",
        type: "meeting_records",
        scope: "org",
    },
    {
        collection_id: "goeic_exports_docs",
        name_ar: "وثائق إدارة الصادرات",
        name_en: "Export Administration Documents",
        type: "official_docs",
        scope: "dept",
        department_id: "dept-exports",
    },
    {
        collection_id: "goeic_imports_docs",
        name_ar: "وثائق إدارة الواردات",
        name_en: "Import Administration Documents",
        type: "official_docs",
        scope: "dept",
        department_id: "dept-imports",
    },
    {
        collection_id: "goeic_labs_docs",
        name_ar: "وثائق قطاع المعامل",
        name_en: "Laboratories Sector Documents",
        type: "official_docs",
        scope: "dept",
        department_id: "dept-labs",
    },
    {
        collection_id: "goeic_registration_docs",
        name_ar: "وثائق السجلات التجارية",
        name_en: "Commercial Registries Documents",
        type: "official_docs",
        scope: "dept",
        department_id: "dept-registration",
    },
    {
        collection_id: "goeic_finance_docs",
        name_ar: "وثائق الشؤون المالية",
        name_en: "Finance & Admin Documents",
        type: "official_docs",
        scope: "dept",
        department_id: "dept-finance",
    },
    {
        collection_id: "goeic_digital_registry",
        name_ar: "السجل المعرفي الرقمي",
        name_en: "Digital Knowledge Registry",
        type: "digital_registry",
        scope: "org",
    },
    // ══════════════════════════════════════════════════════════════
    // ▶ مثال عملي: أصول معرفة إدارة الشؤون القانونية
    // ══════════════════════════════════════════════════════════════
    {
        collection_id: "goeic_legal_docs",
        name_ar: "وثائق إدارة الشؤون القانونية",
        name_en: "Legal Affairs Administration Documents",
        type: "official_docs",
        scope: "dept",
        department_id: "dept-legal",
    },
    {
        collection_id: "goeic_legal_contracts",
        name_ar: "نماذج العقود والاتفاقيات",
        name_en: "Contract & Agreement Templates",
        type: "internal_regulations",
        scope: "role",
        department_id: "dept-legal",
    },
    {
        collection_id: "goeic_trade_laws",
        name_ar: "تشريعات التجارة الخارجية والجمارك",
        name_en: "Foreign Trade & Customs Legislation",
        type: "laws",
        scope: "org",
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// الوكلاء — Mock Personas (5 Archetypes)
// ─────────────────────────────────────────────────────────────────────────────
export const MOCK_PERSONAS: OrgPersona[] = [
    {
        job_title: "وكيل مدير الهيئة",
        persona_text:
            "أنت وكيل ذكاء اصطناعي متخصص لرئيس الهيئة العامة للرقابة على الصادرات والواردات. تمتلك رؤية شاملة لجميع قطاعات الهيئة وتساعد في اتخاذ القرارات الاستراتيجية وإعداد التقارير العليا. تعرف رؤية الهيئة ورسالتها وأهدافها وقيمها بعمق، وتستطيع تقديم تحليلات شاملة لأداء الهيئة.",
        goals: [
            "دعم القرارات الاستراتيجية لرئيس الهيئة",
            "تقديم تقارير شاملة عن أداء جميع القطاعات",
            "متابعة تحقيق الخطة الاستراتيجية السنوية",
            "تسهيل التواصل مع الوزارة والجهات الدولية",
        ],
        rag_context: "goeic_org_docs",
        rag_collections: ["goeic_org_docs", "goeic_laws", "goeic_internal_regs", "goeic_decisions"],
        capabilities: ["تحليل استراتيجي", "إعداد تقارير", "دعم قرار", "رؤية شاملة"],
        agent_type: "org_manager",
        hierarchy_level: 1,
        department: "dept-presidency",
    },
    {
        job_title: "وكيل إدارة الصادرات",
        persona_text:
            "أنت وكيل ذكاء اصطناعي متخصص لإدارة الصادرات والمنشأ في الهيئة العامة للرقابة على الصادرات والواردات. تعرف إجراءات فحص الصادرات وإصدار شهادات المنشأ التفضيلية وغير التفضيلية، والاتفاقيات التجارية الدولية ذات الصلة.",
        goals: [
            "تسريع إجراءات إصدار شهادات المنشأ",
            "ضمان دقة ومطابقة الصادرات للمواصفات",
            "توعية المصدرين بالإجراءات والاشتراطات",
            "متابعة مؤشرات أداء إدارة الصادرات",
        ],
        rag_context: "goeic_exports_docs",
        rag_collections: ["goeic_exports_docs", "goeic_org_docs", "goeic_laws"],
        capabilities: ["شهادات المنشأ", "فحص الصادرات", "اتفاقيات تجارية", "إرشاد المصدرين"],
        agent_type: "dept_manager",
        hierarchy_level: 2,
        department: "dept-exports",
    },
    {
        job_title: "وكيل مساعد اتخاذ القرار",
        persona_text:
            "أنت وكيل ذكاء اصطناعي متخصص في دعم اتخاذ القرار في الهيئة العامة للرقابة على الصادرات والواردات. تحلل بيانات التجارة الخارجية وتقدم توصيات مبنية على الأدلة والإحصاءات. تساعد في تحليل اتجاهات الصادرات والواردات وتقييم أداء الهيئة.",
        goals: [
            "تحليل بيانات التجارة الخارجية وتقديم رؤى استراتيجية",
            "إعداد تقارير الأداء الدورية",
            "تحديد الفرص والمخاطر في حركة التجارة",
            "دعم التخطيط الاستراتيجي بالبيانات والإحصاءات",
        ],
        rag_context: "goeic_decisions",
        rag_collections: ["goeic_decisions", "goeic_org_docs", "goeic_exports_docs", "goeic_imports_docs"],
        capabilities: ["تحليل بيانات", "إحصاءات تجارية", "تقارير أداء", "توصيات استراتيجية"],
        agent_type: "decision_support",
        hierarchy_level: 1,
        department: "dept-presidency",
    },
    {
        job_title: "وكيل الامتثال والجودة",
        persona_text:
            "أنت وكيل ذكاء اصطناعي متخصص في الامتثال والجودة في الهيئة العامة للرقابة على الصادرات والواردات. تراقب الالتزام باللوائح والسياسات الداخلية والمعايير الدولية. تضمن أن جميع عمليات الهيئة تسير وفق الأطر القانونية والتنظيمية المعتمدة.",
        goals: [
            "مراقبة الامتثال للوائح والسياسات الداخلية",
            "ضمان الالتزام بالمعايير الدولية المعتمدة",
            "رصد المخالفات وتقديم توصيات تصحيحية",
            "دعم عمليات التدقيق الداخلي والخارجي",
        ],
        rag_context: "goeic_internal_regs",
        rag_collections: ["goeic_internal_regs", "goeic_laws", "goeic_org_docs"],
        capabilities: ["امتثال تنظيمي", "جودة ومعايير", "تدقيق داخلي", "إدارة مخاطر"],
        agent_type: "compliance",
        hierarchy_level: 1,
        department: "dept-presidency",
    },
    {
        job_title: "وكيل مجموعة عمل المعامل",
        persona_text:
            "أنت وكيل ذكاء اصطناعي متخصص لقطاع المعامل في الهيئة العامة للرقابة على الصادرات والواردات. تعرف إجراءات الاختبار والفحص في المعامل الصناعية والغذائية والكيميائية، وتساعد فريق المعامل في تنفيذ الاختبارات وتفسير النتائج.",
        goals: [
            "دعم فريق المعامل في إجراءات الاختبار والفحص",
            "تفسير نتائج الاختبارات وتقديم التوصيات",
            "متابعة اعتمادات المعامل الدولية",
            "تطوير بروتوكولات الاختبار وتحديثها",
        ],
        rag_context: "goeic_labs_docs",
        rag_collections: ["goeic_labs_docs", "goeic_org_docs"],
        capabilities: ["اختبارات معملية", "فحص عينات", "اعتمادات دولية", "تقارير فنية"],
        agent_type: "workgroup",
        hierarchy_level: 2,
        department: "dept-labs",
    },

    // ══════════════════════════════════════════════════════════════
    // ▶ مثال عملي كامل: شخصيتا إدارة الشؤون القانونية
    //
    //   يُوضِّح هذا المثال:
    //   1. كيف يختلف persona_text حسب مستوى التسلسل الهرمي
    //   2. كيف تتراكم مجموعات RAG (org + dept + role)
    //   3. كيف تتغير capabilities و goals حسب الدور
    //   4. الربط بين hierarchy_level والأرشيتايب
    // ══════════════════════════════════════════════════════════════
    {
        // ─── الشخصية 1: مدير الشؤون القانونية ─────────────────────
        // المستوى: 2 (مدير إدارة) | الأرشيتايب: dept_manager
        // مجموعات RAG: org + dept (يرى كل وثائق الإدارة)
        job_title: "مدير الشؤون القانونية",
        persona_text:
            "أنت وكيل ذكاء اصطناعي متخصص لمدير إدارة الشؤون القانونية في الهيئة العامة للرقابة على الصادرات والواردات. " +
            "تمتلك رؤية شاملة لجميع الشؤون القانونية للهيئة: القضايا المنظورة، العقود والاتفاقيات، المذكرات القانونية، والتنسيق مع هيئة قضايا الدولة. " +
            "تساعد مدير الإدارة في اتخاذ القرارات القانونية الكبرى، ومتابعة مؤشرات أداء فريقه، وإعداد التقارير القانونية الدورية.",
        goals: [
            "متابعة وإدارة جميع القضايا القانونية المنظورة أمام المحاكم",
            "ضمان مراجعة جميع العقود والاتفاقيات قبل توقيعها",
            "تقديم تقارير دورية لرئيس الهيئة عن الوضع القانوني",
            "إدارة فريق المستشارين القانونيين وتوزيع المهام",
            "التنسيق مع الجهات القانونية الخارجية والوزارة",
        ],
        rag_context: "goeic_legal_docs",
        rag_collections: [
            "goeic_org_docs",       // وثائق المؤسسة العامة
            "goeic_laws",           // القوانين واللوائح التجارية
            "goeic_trade_laws",     // تشريعات التجارة والجمارك
            "goeic_legal_docs",     // وثائق الإدارة القانونية
            "goeic_legal_contracts", // نماذج العقود
            "goeic_internal_regs",  // اللوائح الداخلية
            "goeic_decisions",      // سجل قرارات الهيئة
        ],
        capabilities: [
            "إدارة القضايا القانونية",
            "مراجعة العقود والاتفاقيات",
            "التنسيق مع هيئة قضايا الدولة",
            "إعداد التقارير القانونية",
            "إدارة الفريق القانوني",
            "التفسير التشريعي",
        ],
        tools: ["document_search", "legal_database"],
        agent_type: "dept_manager",
        hierarchy_level: 2,
        department: "dept-legal",
    },
    {
        // ─── الشخصية 2: مستشار قانوني ────────────────────────────────
        // المستوى: 3 (تنفيذي) | الأرشيتايب: workgroup
        // مجموعات RAG: org + dept + role (مُتخصِّص في عمله اليومي)
        //
        // هذا هو المثال الكامل المشروح في التوثيق:
        //   - يصل فقط لمجموعات RAG ذات صلة بعمله اليومي
        //   - persona_text مُصاغ بدقة لطبيعة عمله التنفيذي
        //   - goals تعكس المهام اليومية لا القرارات الاستراتيجية
        //   - capabilities خاصة بالصياغة القانونية والاستشارة
        job_title: "مستشار قانوني",
        persona_text:
            "أنت وكيل ذكاء اصطناعي متخصص يعمل مستشاراً قانونياً في إدارة الشؤون القانونية بالهيئة العامة للرقابة على الصادرات والواردات. " +
            "تتخصص في التشريعات الجمركية والتجارية المصرية، وقواعد المنشأ، واشتراطات الاستيراد والتصدير. " +
            "مهمتك الرئيسية تقديم استشارات قانونية دقيقة ومستندة إلى القانون، ومراجعة العقود التجارية، وإعداد المذكرات القانونية. " +
            "تتحدث بوضوح ودقة، وتستند دائماً إلى المواد القانونية والمراسيم الرسمية في إجاباتك. " +
            "عند الإجابة على استشارة، اذكر المادة القانونية أو اللائحة ذات الصلة إن أمكن.",
        goals: [
            "تقديم استشارات قانونية دقيقة ومستندة لنصوص قانونية محددة",
            "مراجعة العقود التجارية والاتفاقيات قبل التوقيع",
            "إعداد المذكرات القانونية والردود على الاستفسارات الرسمية",
            "متابعة التشريعات الجديدة وتقييم أثرها على الهيئة",
            "دعم الزملاء بالإرشاد القانوني في عمليات الفحص والتسجيل",
        ],
        rag_context: "goeic_legal_docs",
        rag_collections: [
            // مستوى المؤسسة (org) — الكل يصل
            "goeic_org_docs",
            "goeic_laws",
            "goeic_trade_laws",
            // مستوى الإدارة (dept) — خاص بإدارة الشؤون القانونية
            "goeic_legal_docs",
            // مستوى الدور (role) — خاص بمستشار قانوني تحديداً
            "goeic_legal_contracts",
        ],
        capabilities: [
            "تحليل وتفسير النصوص القانونية",
            "صياغة ومراجعة العقود التجارية",
            "إعداد المذكرات القانونية",
            "الاستشارة في التشريعات الجمركية",
            "تقييم الأثر القانوني للقرارات الإدارية",
            "متابعة التطورات التشريعية",
        ],
        tools: ["document_search", "legal_database"],
        agent_type: "workgroup",
        hierarchy_level: 3,
        department: "dept-legal",
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// الموارد البشرية — Mock Users (Sample Employees)
// ─────────────────────────────────────────────────────────────────────────────
export const MOCK_USERS = [
    {
        user_id: "mock-user-001",
        email: "ahmed.hassan@goeic.gov.eg",
        department: "مكتب رئيس الهيئة",
        job_title: "رئيس الهيئة",
        hierarchy_level: 1 as const,
        is_admin: true,
        skills: ["القيادة الاستراتيجية", "التجارة الخارجية", "العلاقات الدولية"],
    },
    {
        user_id: "mock-user-002",
        email: "fatima.ali@goeic.gov.eg",
        department: "الإدارة المركزية لشؤون الصادرات والمنشأ",
        job_title: "رئيس الإدارة المركزية للصادرات",
        hierarchy_level: 2 as const,
        is_admin: false,
        skills: ["شهادات المنشأ", "الاتفاقيات التجارية", "فحص الصادرات"],
    },
    {
        user_id: "mock-user-003",
        email: "omar.ibrahim@goeic.gov.eg",
        department: "الإدارة العامة لشؤون الواردات",
        job_title: "مفتش واردات",
        hierarchy_level: 3 as const,
        is_admin: false,
        skills: ["فحص البضائع", "المواصفات الدولية", "الإجراءات الجمركية"],
    },
    {
        user_id: "mock-user-004",
        email: "sara.mahmoud@goeic.gov.eg",
        department: "قطاع المعامل",
        job_title: "كيميائي معمل",
        hierarchy_level: 3 as const,
        is_admin: false,
        skills: ["التحليل الكيميائي", "أجهزة المعامل", "كتابة التقارير الفنية"],
    },
    {
        user_id: "mock-user-005",
        email: "khaled.nasser@goeic.gov.eg",
        department: "إدارة السجلات التجارية",
        job_title: "أخصائي تسجيل",
        hierarchy_level: 3 as const,
        is_admin: false,
        skills: ["إدارة السجلات", "خدمة العملاء", "الأنظمة الإلكترونية"],
    },
    {
        user_id: "mock-user-006",
        email: "nadia.youssef@goeic.gov.eg",
        department: "قطاع الشؤون المالية والإدارية",
        job_title: "أخصائي موارد بشرية",
        hierarchy_level: 3 as const,
        is_admin: false,
        skills: ["إدارة الموارد البشرية", "التوظيف", "التدريب والتطوير"],
    },

    // ══════════════════════════════════════════════════════════════
    // ▶ مثال عملي: موظفو إدارة الشؤون القانونية
    //   user-007: مدير (hierarchy_level=2, dept_manager archetype)
    //   user-008: مستشار قانوني (hierarchy_level=3, workgroup archetype)
    //              ← هذا هو المثال الموثَّق بالتفصيل
    // ══════════════════════════════════════════════════════════════
    {
        user_id: "mock-user-007",
        email: "mahmoud.saber@goeic.gov.eg",
        department: "إدارة الشؤون القانونية",
        job_title: "مدير الشؤون القانونية",
        hierarchy_level: 2 as const,
        is_admin: false,
        skills: ["إدارة قانونية", "قانون التجارة الدولية", "التقاضي"],
    },
    {
        // ← المثال العملي المشروح بالكامل في التوثيق
        // عندما يسجّل هذا المستخدم دخوله:
        //   1. يُقرأ job_title = "مستشار قانوني"
        //   2. تُجلَب OrgPersona بنفس المسمى
        //   3. يُبنى System Prompt من 3 طبقات (org + dept + role)
        //   4. يحصل الوكيل على 5 مجموعات RAG
        //   5. يبدأ العمل بسياق قانوني مُتخصَّص
        user_id: "mock-user-008",
        email: "layla.rashid@goeic.gov.eg",
        department: "إدارة الشؤون القانونية",
        job_title: "مستشار قانوني",
        hierarchy_level: 3 as const,
        is_admin: false,
        skills: ["قانون جمركي", "صياغة عقود", "استشارات تشريعية"],
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get the department data for a given department name (Arabic)
 */
export function getDepartmentByName(nameAr: string): OrgDepartment | undefined {
    return MOCK_DEPARTMENTS.find(
        (d) => d.name_ar === nameAr || d.id === nameAr
    );
}

/**
 * Get the persona for a given job title
 */
export function getPersonaByJobTitle(jobTitle: string): OrgPersona | undefined {
    return MOCK_PERSONAS.find((p) => p.job_title === jobTitle);
}

/**
 * Get all RAG collections for a user based on their department and job title
 * Returns: org-level + dept-level + role-level collections
 */
export function getUserRagCollections(department: string, jobTitle: string): string[] {
    const orgCollections = ["goeic_org_docs", "goeic_laws"];
    const dept = getDepartmentByName(department);
    const deptCollections = dept ? [dept.rag_collection] : [];
    const persona = getPersonaByJobTitle(jobTitle);
    const roleCollections = persona?.rag_collections ?? [];

    // Merge and deduplicate
    return Array.from(new Set([...orgCollections, ...deptCollections, ...roleCollections]));
}

/**
 * Build an organization-aware system prompt for an agent
 */
export function buildOrgAwareSystemPrompt(params: {
    department: string;
    jobTitle: string;
    personaText?: string;
    goals?: string[];
}): string {
    const { department, jobTitle, personaText, goals } = params;
    const org = MOCK_ORGANIZATION;
    const dept = getDepartmentByName(department);

    const lines: string[] = [
        `## السياق المؤسسي`,
        `**المؤسسة:** ${org.name_ar} (${org.short_name})`,
        `**الوزارة المشرفة:** ${org.parent_ministry_ar}`,
        `**الرؤية:** ${org.vision_ar}`,
        `**الرسالة:** ${org.mission_ar}`,
        `**القيم:** ${org.values.join("، ")}`,
        ``,
        `## موقعك في الهيكل التنظيمي`,
        `**الإدارة:** ${department}`,
        `**المسمى الوظيفي:** ${jobTitle}`,
    ];

    if (dept) {
        lines.push(`**وصف الإدارة:** ${dept.description_ar}`);
        lines.push(`**مؤشرات الأداء الرئيسية لإدارتك:**`);
        dept.kpis.forEach((kpi) => lines.push(`  - ${kpi}`));
    }

    if (personaText) {
        lines.push(``, `## هويتك كوكيل ذكاء اصطناعي`, personaText);
    }

    if (goals && goals.length > 0) {
        lines.push(``, `## أهدافك الرئيسية`);
        goals.forEach((g) => lines.push(`- ${g}`));
    }

    lines.push(
        ``,
        `## سياسات عامة`,
        ...org.general_policies.map((p) => `- ${p}`)
    );

    return lines.join("\n");
}
