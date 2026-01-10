#!/usr/bin/env node

import { program } from 'commander'

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

// Commands will be registered here in Phase 2:
// registerWorkspaceCommand(program)
// registerUserCommand(program)
// registerChannelCommand(program)
// etc.

program.parse()
