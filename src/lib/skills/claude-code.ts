import { mkdir, rm, stat, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { SKILL_CONTENT, SKILL_DESCRIPTION, SKILL_NAME } from './content.js'
import type { InstallOptions, SkillInstaller, UninstallOptions } from './types.js'

function getGlobalSkillsDir(): string {
    return join(homedir(), '.claude', 'skills')
}

function getLocalSkillsDir(): string {
    return join(process.cwd(), '.claude', 'skills')
}

export class ClaudeCodeInstaller implements SkillInstaller {
    name = 'claude-code'
    description = 'Claude Code skill for Twist CLI integration'

    getInstallPath(options: { local?: boolean }): string {
        const baseDir = options.local ? getLocalSkillsDir() : getGlobalSkillsDir()
        return join(baseDir, SKILL_NAME, 'SKILL.md')
    }

    async isInstalled(options: { local?: boolean }): Promise<boolean> {
        const skillPath = this.getInstallPath(options)
        try {
            await stat(skillPath)
            return true
        } catch {
            return false
        }
    }

    async install(options: InstallOptions): Promise<void> {
        const skillPath = this.getInstallPath(options)
        const exists = await this.isInstalled(options)

        if (exists && !options.force) {
            throw new Error(`Skill already installed at ${skillPath}. Use --force to overwrite.`)
        }

        await mkdir(dirname(skillPath), { recursive: true })
        await writeFile(skillPath, SKILL_CONTENT)
    }

    async uninstall(options: UninstallOptions): Promise<void> {
        const skillPath = this.getInstallPath(options)
        const exists = await this.isInstalled(options)

        if (!exists) {
            throw new Error(`Skill not installed at ${skillPath}`)
        }

        const skillDir = dirname(skillPath)
        await rm(skillDir, { recursive: true })
    }
}

export function getSkillDescription(): string {
    return SKILL_DESCRIPTION
}
