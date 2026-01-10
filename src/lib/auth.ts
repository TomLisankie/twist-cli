import { getConfig, getConfigPath } from './config.js'

export async function getApiToken(): Promise<string> {
  const envToken = process.env.TWIST_API_TOKEN
  if (envToken) {
    return envToken
  }

  const config = await getConfig()
  if (config.token) {
    return config.token
  }

  throw new Error(
    `No API token found. Set TWIST_API_TOKEN environment variable or add "token" to ${getConfigPath()}`,
  )
}
