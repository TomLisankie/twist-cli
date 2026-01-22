import { ClaudeCodeInstaller, getSkillDescription } from './claude-code.js'
import type { AgentInfo, SkillInstaller } from './types.js'

const installers: Record<string, () => SkillInstaller> = {
    'claude-code': () => new ClaudeCodeInstaller(),
}

const agentDescriptions: Record<string, string> = {
    'claude-code': getSkillDescription(),
}

export function getInstaller(name: string): SkillInstaller | null {
    const factory = installers[name]
    return factory ? factory() : null
}

export function listAgentNames(): string[] {
    return Object.keys(installers)
}

export async function listAgents(local: boolean): Promise<AgentInfo[]> {
    const agents: AgentInfo[] = []

    for (const name of listAgentNames()) {
        const installer = getInstaller(name)
        if (!installer) continue

        const installed = await installer.isInstalled({ local })
        agents.push({
            name,
            description: agentDescriptions[name] || installer.description,
            installed,
            path: installed ? installer.getInstallPath({ local }) : null,
        })
    }

    return agents
}

export type { AgentInfo, InstallOptions, SkillInstaller, UninstallOptions } from './types.js'
