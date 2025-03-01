import axios from 'axios'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let { GITHUB_TOKEN, REPO_OWNER, REPO_NAME } = process.env

const headers = {
  Authorization: `Bearer ${GITHUB_TOKEN}`,
  'Content-Type': 'application/json',
  Accept: 'application/vnd.github.spiderman-preview+json'
}

REPO_OWNER = 'KarinJS'
REPO_NAME = 'Karin'
const baseUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`

const dataDir = join(__dirname, 'data')

/** 清空data目录 */
function clearDataDirectory () {
  if (fs.existsSync(dataDir)) {
    fs.rmSync(dataDir, { recursive: true })
    console.log(`Cleared data directory at ${dataDir}`)
  }
  fs.mkdirSync(dataDir, { recursive: true })
  console.log(`Created data directory at ${dataDir}`)
}

clearDataDirectory()

const apiEndpoints = [
  `${baseUrl}`,
  `${baseUrl}/contributors`,
  `https://api.github.com/search/issues?q=repo:${REPO_OWNER}/${REPO_NAME}+type:pr`,
  `https://api.github.com/search/issues?q=repo:${REPO_OWNER}/${REPO_NAME}+type:issue`,
  `${baseUrl}/stargazers`,
  `${baseUrl}/forks`,
  `${baseUrl}/subscribers`,
  `${baseUrl}/commits`,
  `${baseUrl}/tags`,
  `${baseUrl}/license`,
  `${baseUrl}/discussions`,
  `${baseUrl}/releases`,
  `${baseUrl}/branches`,
]

async function fetchAndSaveData () {
  for (const endpoint of apiEndpoints) {
    try {
      const response = await axios.get(endpoint, { headers })
      const isSearchEndpoint = endpoint.includes('/search/issues')
      const fileName = isSearchEndpoint ?
        `${new URL(endpoint).searchParams.get('q').includes('type:pr') ? 'pulls' : 'issues'}.json` :
        `${endpoint.split('/').pop().split('?')[0]}.json`

      const filePath = join(dataDir, fileName)
      fs.writeFileSync(filePath, JSON.stringify(response.data, null, 2))
      console.log(`Data saved to ${filePath}`)
    } catch (error) {
      console.error(`Error fetching data from ${endpoint}:`, error.message)
    }
  }
}

fetchAndSaveData()