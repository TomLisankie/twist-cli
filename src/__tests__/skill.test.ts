import { mkdir, readFile, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Command } from 'commander'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('chalk', () => ({
    default: {
        green: vi.fn((text) => text),
        bold: vi.fn((text) => text),
        dim: vi.fn((text) => text),
    },
}))

import { registerSkillCommand } from '../commands/skill.js'
import { ClaudeCodeInstaller } from '../lib/skills/claude-code.js'
import { SKILL_CONTENT } from '../lib/skills/content.js'
import { getInstaller, listAgentNames, listAgents } from '../lib/skills/index.js'

function createProgram() {
    const program = new Command()
    program.exitOverride()
    registerSkillCommand(program)
    return program
}

describe('skill registry', () => {
    it('returns claude-code installer', () => {
        const installer = getInstaller('claude-code')
        expect(installer).not.toBeNull()
        expect(installer?.name).toBe('claude-code')
    })

    it('returns null for unknown agent', () => {
        const installer = getInstaller('unknown-agent')
        expect(installer).toBeNull()
    })

    it('lists available agents', () => {
        const names = listAgentNames()
        expect(names).toContain('claude-code')
    })
})

describe('ClaudeCodeInstaller', () => {
    let testDir: string
    let installer: ClaudeCodeInstaller
    const originalCwd = process.cwd()

    beforeEach(async () => {
        testDir = join(tmpdir(), `twist-cli-test-${Date.now()}`)
        await mkdir(testDir, { recursive: true })
        process.chdir(testDir)
        installer = new ClaudeCodeInstaller()
    })

    afterEach(async () => {
        process.chdir(originalCwd)
        await rm(testDir, { recursive: true, force: true })
    })

    it('returns correct local install path', () => {
        const path = installer.getInstallPath({ local: true })
        expect(path).toContain('.claude/skills/twist-cli/SKILL.md')
        expect(path).toContain('twist-cli-test-')
    })

    it('reports not installed initially (local)', async () => {
        const installed = await installer.isInstalled({ local: true })
        expect(installed).toBe(false)
    })

    it('installs skill locally', async () => {
        await installer.install({ local: true })
        const installed = await installer.isInstalled({ local: true })
        expect(installed).toBe(true)

        const skillPath = installer.getInstallPath({ local: true })
        const content = await readFile(skillPath, 'utf-8')
        expect(content).toBe(SKILL_CONTENT)
    })

    it('throws when installing without force if exists', async () => {
        await installer.install({ local: true })
        await expect(installer.install({ local: true })).rejects.toThrow(
            /already installed.*Use --force/,
        )
    })

    it('allows force install over existing', async () => {
        await installer.install({ local: true })
        await expect(installer.install({ local: true, force: true })).resolves.not.toThrow()
    })

    it('uninstalls skill', async () => {
        await installer.install({ local: true })
        await installer.uninstall({ local: true })
        const installed = await installer.isInstalled({ local: true })
        expect(installed).toBe(false)
    })

    it('throws when uninstalling non-existent skill', async () => {
        await expect(installer.uninstall({ local: true })).rejects.toThrow(/not installed/)
    })
})

describe('listAgents', () => {
    let testDir: string
    const originalCwd = process.cwd()

    beforeEach(async () => {
        testDir = join(tmpdir(), `twist-cli-test-${Date.now()}`)
        await mkdir(testDir, { recursive: true })
        process.chdir(testDir)
    })

    afterEach(async () => {
        process.chdir(originalCwd)
        await rm(testDir, { recursive: true, force: true })
    })

    it('returns agent info with installed status', async () => {
        const agents = await listAgents(true)
        expect(agents.length).toBeGreaterThan(0)

        const claudeCode = agents.find((a) => a.name === 'claude-code')
        expect(claudeCode).toBeDefined()
        expect(claudeCode?.installed).toBe(false)
        expect(claudeCode?.path).toBeNull()
    })

    it('shows installed path when installed', async () => {
        const installer = new ClaudeCodeInstaller()
        await installer.install({ local: true })

        const agents = await listAgents(true)
        const claudeCode = agents.find((a) => a.name === 'claude-code')
        expect(claudeCode?.installed).toBe(true)
        expect(claudeCode?.path).toContain('SKILL.md')
    })
})

describe('skill command', () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>
    let testDir: string
    const originalCwd = process.cwd()

    beforeEach(async () => {
        vi.clearAllMocks()
        consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

        testDir = join(tmpdir(), `twist-cli-test-${Date.now()}`)
        await mkdir(testDir, { recursive: true })
        process.chdir(testDir)
    })

    afterEach(async () => {
        consoleSpy.mockRestore()
        consoleErrorSpy.mockRestore()
        process.chdir(originalCwd)
        await rm(testDir, { recursive: true, force: true })
    })

    it('lists agents', async () => {
        const program = createProgram()
        await program.parseAsync(['node', 'tw', 'skill', 'list', '--local'])
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Available agents'))
    })

    it('installs agent locally', async () => {
        const program = createProgram()
        await program.parseAsync(['node', 'tw', 'skill', 'install', 'claude-code', '--local'])
        expect(consoleSpy).toHaveBeenCalledWith('✓', expect.stringContaining('Installed'))

        const skillPath = join(testDir, '.claude', 'skills', 'twist-cli', 'SKILL.md')
        const stats = await stat(skillPath)
        expect(stats.isFile()).toBe(true)
    })

    it('uninstalls agent', async () => {
        const installer = new ClaudeCodeInstaller()
        await installer.install({ local: true })

        const program = createProgram()
        await program.parseAsync(['node', 'tw', 'skill', 'uninstall', 'claude-code', '--local'])
        expect(consoleSpy).toHaveBeenCalledWith('✓', expect.stringContaining('Uninstalled'))
    })

    it('errors on unknown agent', async () => {
        const program = createProgram()
        const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
            throw new Error('process.exit')
        })

        await expect(
            program.parseAsync(['node', 'tw', 'skill', 'install', 'unknown-agent', '--local']),
        ).rejects.toThrow()

        expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown agent'))
        exitSpy.mockRestore()
    })
})
