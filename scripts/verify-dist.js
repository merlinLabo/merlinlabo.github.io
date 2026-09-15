import assert from 'node:assert/strict'
import { readdir, readFile, stat } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../dist')
const files = await readdir(root, { recursive: true })
assert(files.includes('index.html'))
assert(!files.some(file => /(^|[/\\])(admin|api|functions)([/\\]|$)|rsvp/i.test(file)))
let checked = 0
for (const name of files) {
  if (!/\.(html|css|js)$/.test(name)) continue
  const contents = await readFile(resolve(root, name), 'utf8')
  assert.doesNotMatch(contents, /新郎姓名|新娘姓名|示例市|2030|待确认/)
  for (const [, asset] of contents.matchAll(/(?:["'(])\/(?:wedding\/)?((?:assets\/)[^"'\s)<>]+)/g)) {
    assert((await stat(resolve(root, asset))).isFile(), `Missing asset: ${asset}`)
    checked++
  }
}
console.log(`静态发布检查通过：${checked} 处资源引用有效，无管理页和登记接口。`)
