import chalk from 'chalk'
import { Command } from 'commander'
import { getInstaller, listAgents } from '../lib/skills/index.js'
import type { InstallOptions, UninstallOptions } from '../lib/skills/types.js'

interface ListOptions {
    local?: boolean
}

async function list(options: ListOptions): Promise<void> {
    const agents = await listAgents(options.local ?? false)

    if (agents.length === 0) {
        console.log('No agents available.')
        return
    }

    const location = options.local ? 'local' : 'global'
    console.log(chalk.bold(`Available agents (${location}):`))
    console.log('')

    for (const agent of agents) {
        const status = agent.installed ? chalk.green('✓ installed') : chalk.dim('not installed')
        console.log(`  ${chalk.bold(agent.name)}  ${status}`)
        console.log(`    ${agent.description}`)
        if (agent.path) {
            console.log(`    ${chalk.dim(agent.path)}`)
        }
        console.log('')
    }
}

async function install(agentName: string, options: InstallOptions): Promise<void> {
    const installer = getInstaller(agentName)

    if (!installer) {
        console.error(`Unknown agent: ${agentName}`)
        console.error('Run `tw skill list` to see available agents.')
        process.exit(1)
    }

    try {
        await installer.install(options)
        const location = options.local ? 'locally' : 'globally'
        console.log(chalk.green('✓'), `Installed ${agentName} ${location}`)
        console.log(chalk.dim(`  ${installer.getInstallPath(options)}`))
    } catch (err) {
        console.error((err as Error).message)
        process.exit(1)
    }
}

async function uninstall(agentName: string, options: UninstallOptions): Promise<void> {
    const installer = getInstaller(agentName)

    if (!installer) {
        console.error(`Unknown agent: ${agentName}`)
        process.exit(1)
    }

    try {
        await installer.uninstall(options)
        const location = options.local ? 'locally' : 'globally'
        console.log(chalk.green('✓'), `Uninstalled ${agentName} ${location}`)
    } catch (err) {
        console.error((err as Error).message)
        process.exit(1)
    }
}

export function registerSkillCommand(program: Command): void {
    const skill = program.command('skill').description('Manage agent skill integrations')

    skill
        .command('list')
        .description('List available agents and install status')
        .option('--local', 'Check local installation (./.claude/skills/)')
        .action(list)

    skill
        .command('install <agent>')
        .description('Install an agent skill')
        .option('--local', 'Install locally in project (./.claude/skills/)')
        .option('--force', 'Overwrite existing installation')
        .action(install)

    skill
        .command('uninstall <agent>')
        .description('Uninstall an agent skill')
        .option('--local', 'Uninstall from local project')
        .action(uninstall)
}
