#!/usr/bin/env node

import { program } from 'commander'
import { registerWorkspaceCommand } from './commands/workspace.js'
import { registerUserCommand } from './commands/user.js'
import { registerChannelCommand } from './commands/channel.js'

program
  .name('tw')
  .description('Twist CLI')
  .version('0.1.0')
  .addHelpText(
    'after',
    `
Note for AI/LLM agents:
  Use --json or --ndjson flags for unambiguous, parseable output.
  Default JSON shows essential fields; use --full for all fields.`,
  )

registerWorkspaceCommand(program)
registerUserCommand(program)
registerChannelCommand(program)

program.parse()
