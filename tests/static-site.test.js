import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'

const app = await readFile(new URL('../app.js', import.meta.url), 'utf8')
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8')
const config = vm.runInNewContext(`${app.split('const contentValues')[0]}; weddingConfig`)

test('wedding details and schedule match the supplied document', () => {
  assert.equal(config.groom, '陈晓东')
  assert.equal(config.bride, '范婧琪')
  assert.equal(config.weddingDate, '2026-10-14T18:00:00+08:00')
  assert.equal(new Date(config.weddingDate).toISOString(), '2026-10-14T10:00:00.000Z')
  assert.equal(new Date(config.weddingDate).getUTCDay(), 3)
  assert.equal(config.venue, '湛江市霞山区乐山大道29号君豪酒店')
  assert.equal(config.venueShort, '君豪酒店三楼大宴会厅')
  assert.equal(config.navigationUrl, 'https://surl.amap.com/bPbGjGW1aer0')
  assert.equal(Array.from(config.schedule, item => item.time).join(','), '18:00,19:00,19:30')
})

test('invitation has no registration UI, API calls, or registration imports', () => {
  assert.doesNotMatch(html, /<form\b|data-rsvp|id="rsvp"|\/admin\//)
  assert.doesNotMatch(app, /rsvp|fetch\s*\(|\/api\//i)
  assert.doesNotMatch(html + app, /新郎姓名|新娘姓名|示例市|2030|待确认/)
  assert.match(html, /陈晓东.*范婧琪/)
})
