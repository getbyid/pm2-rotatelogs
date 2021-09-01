#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const pm2 = require('pm2')

const logsPattern = /-out-\d+\.log/

function prefixFileName(prefix, filePath) {
  const pos = filePath.lastIndexOf(path.sep) + 1
  return pos > 0
    ? filePath.slice(0, pos) + prefix + '_' + filePath.slice(pos)
    : filePath + '_' + prefix
}

function deleteOldFiles(dir, weeks) {
  // при отладке - минуты вместо недель
  // weeks /= 7 * 24 * 60
  const ms = Date.now() - weeks * 7 * 24 * 3600 * 1000

  const dt = new Date(ms).toISOString().substr(0, 19)
  console.log(`Delete logs older than ${dt} from ${dir}:`)
  fs.readdirSync(dir)
    .filter((name) => logsPattern.test(name))
    .forEach((name) => {
      const file = path.join(dir, name)
      const stat = fs.statSync(file)
      if (stat.mtimeMs < ms) {
        fs.unlinkSync(file)
        console.log(name, 'DELETED')
      } else {
        console.log(name, 'skip')
      }
    })
}

pm2.connect(function (err) {
  if (err) {
    console.error(err.stack || err)
    return
  }

  pm2.list(function (err, apps) {
    if (err) {
      console.error(err.stack || err)
      return
    }
    console.log('Number of applications:', apps.length)

    const dt = new Date().toISOString().substr(0, 19).replace(/:/g, '-')
    // 2020-12-31T12-34-56 (UTC)

    let dirs = new Set()

    apps.forEach(function (app) {
      // console.log(app.pm2_env)
      const { name, pm_out_log_path: logPath } = app.pm2_env
      dirs.add(path.dirname(logPath))
      const newPath = prefixFileName(dt, logPath)
      fs.renameSync(logPath, newPath)
      console.log(`${name} ${newPath}`)
    })
    pm2.reloadLogs()
    pm2.disconnect()

    const args = process.argv.slice(2)
    const weeks = args[0] || 10
    for (const dir of dirs) {
      deleteOldFiles(dir, weeks)
    }

    console.log('OK')
  })
})
