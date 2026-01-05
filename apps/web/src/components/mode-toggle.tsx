"use client";

import * as React from "react";
import { Moon, Sun, Languages } from "lucide-react";
import { useTheme } from "next-themes";
import { useLanguage } from "@/providers/Language";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

export function ModeToggle() {
    const { setTheme, theme } = useTheme();
    const { language, setLanguage, t } = useLanguage();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative glass-card border-none hover:neon-border-purple transition-all duration-300">
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-primary" />
                    <span className="sr-only">Toggle theme/language</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-card neon-border-purple border-none mt-2">
                <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-foreground/50 font-black">{t('theme')}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setTheme("light")} className="hover:bg-primary/10 cursor-pointer">
                    Light Mode
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")} className="hover:bg-primary/10 cursor-pointer">
                    Dark Mode
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")} className="hover:bg-primary/10 cursor-pointer">
                    System Default
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-primary/10" />

                <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-foreground/50 font-black">{t('language')}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setLanguage("en")} className={language === 'en' ? 'bg-primary/20 cursor-pointer' : 'hover:bg-primary/10 cursor-pointer'}>
                    English
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage("ar")} className={language === 'ar' ? 'bg-primary/20 cursor-pointer' : 'hover:bg-primary/10 cursor-pointer'}>
                    العربية (Arabic)
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
