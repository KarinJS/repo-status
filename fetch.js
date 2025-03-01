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
  `${baseUrl}/pulls?state=open&per_page=100`,
  `${baseUrl}/pulls?state=closed&per_page=100`,
  `${baseUrl}/issues?state=open&per_page=100`,
  `${baseUrl}/issues?state=closed&per_page=100`,
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

function parseLinkHeader (linkHeader) {
  const links = {}
  if (!linkHeader) return links
  const linkEntries = linkHeader.split(', ')
  linkEntries.forEach(entry => {
    const [urlPart, relPart] = entry.split('; ')
    const url = urlPart.slice(1, -1)
    const rel = relPart.split('=')[1].slice(1, -1)
    links[rel] = url
  })
  return links
}

async function fetchPaginatedData (endpoint) {
  let allData = []
  let page = 1
  let hasMore = true
  const url = new URL(endpoint)

  while (hasMore) {
    url.searchParams.set('page', page)
    try {
      const response = await axios.get(url.toString(), { headers })
      allData = allData.concat(response.data)
      const linkHeader = response.headers.link

      if (linkHeader) {
        const links = parseLinkHeader(linkHeader)
        hasMore = !!links.next
      } else {
        hasMore = false
      }
      page++
    } catch (error) {
      console.error(`Error fetching page ${page} of ${endpoint}:`, error.message)
      break
    }
  }
  return allData
}

async function fetchAndSaveData () {
  for (const endpoint of apiEndpoints) {
    try {
      const url = new URL(endpoint)
      const pathSegments = url.pathname.split('/')
      const resource = pathSegments.pop()
      const isPaginated = ['pulls', 'issues'].includes(resource)

      let data
      if (isPaginated) {
        data = await fetchPaginatedData(endpoint)
      } else {
        const response = await axios.get(endpoint, { headers })
        data = response.data
      }

      let fileName
      if (resource === 'pulls' || resource === 'issues') {
        const state = url.searchParams.get('state')
        fileName = `${resource === 'pulls' ? 'pr' : 'issue'}_${state}.json`
      } else {
        fileName = `${resource}.json`
      }

      const filePath = join(dataDir, fileName)
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
      console.log(`Data saved to ${filePath}`)
    } catch (error) {
      console.error(`Error fetching data from ${endpoint}:`, error.message)
    }
  }
}

fetchAndSaveData()