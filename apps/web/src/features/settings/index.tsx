"use client";

import React from "react";
import { Settings } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLocalStorage } from "@/hooks/use-local-storage";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KeyRound, Server } from "lucide-react";
import { OllamaSettings } from "./ollama-settings";

import { useSearchParams, useRouter } from "next/navigation";

/**
 * The Settings interface component containing API Keys and Ollama configuration.
 */
export default function SettingsInterface(): React.ReactNode {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get("tab") || "api-keys";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`?${params.toString()}`);
  };

  // Use localStorage hooks for each API key
  const [openaiApiKey, setOpenaiApiKey] = useLocalStorage<string>(
    "lg:settings:openaiApiKey",
    "",
  );
  const [anthropicApiKey, setAnthropicApiKey] = useLocalStorage<string>(
    "lg:settings:anthropicApiKey",
    "",
  );
  const [googleApiKey, setGoogleApiKey] = useLocalStorage<string>(
    "lg:settings:googleApiKey",
    "",
  );
  const [tavilyApiKey, setTavilyApiKey] = useLocalStorage<string>(
    "lg:settings:tavilyApiKey",
    "",
  );

  return (
    <div className="flex w-full flex-col gap-6 p-10 max-w-6xl mx-auto anime-fade-in">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center justify-start gap-3">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Settings className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your application preferences and integrations.</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-8 bg-muted/50 p-1">
          <TabsTrigger value="api-keys" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
            <KeyRound className="size-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="ollama" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
            <Server className="size-4" />
            Ollama
          </TabsTrigger>
        </TabsList>

        <TabsContent value="api-keys" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <div className="grid gap-6">
            <Card className="border-none bg-background/50 backdrop-blur-sm shadow-xl ring-1 ring-border">
              <CardHeader>
                <CardTitle>API Keys</CardTitle>
                <CardDescription>
                  These keys are stored locally in your browser and used to authenticate with external services.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                {/* OpenAI API Key */}
                <div className="grid gap-2">
                  <Label htmlFor="openai-api-key" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">OpenAI API Key</Label>
                  <PasswordInput
                    id="openai-api-key"
                    placeholder="sk-..."
                    value={openaiApiKey}
                    onChange={(e) => setOpenaiApiKey(e.target.value)}
                    className="bg-background/50 h-11"
                  />
                </div>

                {/* Anthropic API Key */}
                <div className="grid gap-2">
                  <Label htmlFor="anthropic-api-key" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Anthropic API Key</Label>
                  <PasswordInput
                    id="anthropic-api-key"
                    placeholder="sk-ant-..."
                    value={anthropicApiKey}
                    onChange={(e) => setAnthropicApiKey(e.target.value)}
                    className="bg-background/50 h-11"
                  />
                </div>

                {/* Google Gen AI API Key */}
                <div className="grid gap-2">
                  <Label htmlFor="google-api-key" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Google Gen AI API Key</Label>
                  <PasswordInput
                    id="google-api-key"
                    placeholder="Enter Google API key"
                    value={googleApiKey}
                    onChange={(e) => setGoogleApiKey(e.target.value)}
                    className="bg-background/50 h-11"
                  />
                </div>

                {/* Tavily API Key */}
                <div className="grid gap-2">
                  <Label htmlFor="tavily-api-key" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Tavily API Key</Label>
                  <PasswordInput
                    id="tavily-api-key"
                    placeholder="tvly-..."
                    value={tavilyApiKey}
                    onChange={(e) => setTavilyApiKey(e.target.value)}
                    className="bg-background/50 h-11"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ollama" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <OllamaSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
