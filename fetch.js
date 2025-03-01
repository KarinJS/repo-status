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

// const baseUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;
REPO_OWNER = 'KarinJS'
REPO_NAME = 'Karin'
const baseUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`

const dataDir = join(__dirname, 'data')

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
  console.log(`Created data directory at ${dataDir}`)
}

const apiEndpoints = [
  `${baseUrl}`,                     // 获取仓库状态
  `${baseUrl}/contributors`,        // 获取贡献者列表
  `https://api.github.com/search/issues?q=repo:${REPO_OWNER}/${REPO_NAME}+type:pr`,     // PR总数
  `https://api.github.com/search/issues?q=repo:${REPO_OWNER}/${REPO_NAME}+type:issue`,  // Issue总数
  `${baseUrl}/stargazers`,          // 获取 STARS
  `${baseUrl}/forks`,               // 获取 FORK
  `${baseUrl}/subscribers`,         // 获取关注数据
  `${baseUrl}/commits`,             // 获取最后提交时间
  `${baseUrl}/tags`,                // 获取最新 tag
  `${baseUrl}/license`,             // 获取最新版本许可证
  `${baseUrl}/discussions`,         // 获取讨论数据
  `${baseUrl}/releases`,            // 获取releases信息
  `${baseUrl}/branches`,            // 获取分支列表
]

async function fetchAndSaveData () {
  for (const endpoint of apiEndpoints) {
    try {
      const response = await axios.get(endpoint, { headers })
      // 特殊处理搜索接口的文件名
      const isSearchEndpoint = endpoint.includes('/search/issues')
      const fileName = isSearchEndpoint ?
        `${new URL(endpoint).searchParams.get('q').includes('type:pr') ? 'pr' : 'issue'}.json` :
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