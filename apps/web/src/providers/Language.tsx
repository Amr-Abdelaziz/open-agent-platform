"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "ar";
type Direction = "ltr" | "rtl";

interface LanguageContextType {
    language: Language;
    direction: Direction;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
    en: {
        chat: "Chat",
        agents: "Agents",
        tools: "Tools",
        rag: "RAG",
        history: "History",
        settings: "Settings",
        signin: "Sign In",
        signup: "Sign Up",
        logout: "Log Out",
        theme: "Theme",
        language: "Language",
        neural_node_management: "Organization Assistants",
        active_nodes: "Active Nodes",
        synchronize_nodes: "Synchronize local and remote processing units to the Gorbit network.",
        no_collections: "No Collections Found",
        initialize_orbital_node: "Initialize Orbital Node",
        documents: "Documents",
        orbital_resource: "Orbital resource management",
        chat_with_satellite: "Chat with Satellite",
        type_message: "Type your message...",
        send: "Send",
        cancel: "Cancel",
        admin: "Admin",
        organization: "Organization",
    },
    ar: {
        chat: "المحادثة",
        agents: "الوكلاء",
        tools: "الأدوات",
        rag: "قاعدة المعرفة",
        history: "السجل",
        settings: "الإعدادات",
        signin: "تسجيل الدخول",
        signup: "إنشاء حساب",
        logout: "تسجيل الخروج",
        theme: "المظهر",
        language: "اللغة",
        neural_node_management: "إدارة العقد العصبية",
        active_nodes: "العقد النشطة",
        synchronize_nodes: "مزامنة وحدات المعالجة المحلية والبعيدة مع شبكة جوربيت.",
        no_collections: "لم يتم العثور على مجموعات",
        initialize_orbital_node: "تهيئة عقدة مدارية",
        documents: "المستندات",
        orbital_resource: "إدارة الموارد المدارية",
        chat_with_satellite: "تحدث مع القمر الصناعي",
        type_message: "اكتب رسالتك...",
        send: "إرسال",
        cancel: "إلغاء",
        admin: "الإدارة",
        organization: "الهيكل التنظيمي",
    },
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguageState] = useState<Language>("en");
    const [direction, setDirection] = useState<Direction>("ltr");

    useEffect(() => {
        const savedLang = localStorage.getItem("language") as Language;
        if (savedLang && (savedLang === "en" || savedLang === "ar")) {
            setLanguageState(savedLang);
            setDirection(savedLang === "ar" ? "rtl" : "ltr");
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        setDirection(lang === "ar" ? "rtl" : "ltr");
        localStorage.setItem("language", lang);
        document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
        document.documentElement.lang = lang;
    };

    const t = (key: string) => {
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, direction, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
}
