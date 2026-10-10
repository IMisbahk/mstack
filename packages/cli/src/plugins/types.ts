import type { InstallProfile, IntegrationSpec } from "../../../ai-integrations/src/index.js";

export interface PluginContext {
  readonly root: string;
  readonly projectName: string;
  readonly profile?: InstallProfile;
  readonly arena?: boolean;
}

export interface IntegrationPack {
  readonly id: string;
  readonly displayName: string;
  readonly description: string;
  createSpec(context: PluginContext): IntegrationSpec;
}

export interface GeneratorContribution {
  readonly id: string;
  readonly description: string;
}

export interface TemplateContribution {
  readonly id: string;
  readonly description: string;
}

export interface MstackPlugin {
  readonly id: string;
  readonly version: string;
  readonly displayName: string;
  readonly description: string;
  readonly integrations?: readonly IntegrationPack[];
  readonly generators?: readonly GeneratorContribution[];
  readonly templates?: readonly TemplateContribution[];
}
