#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const pm2 = require('pm2')

const logsPattern = /-out-\d+\.log/

/**
 * Добавить префикс к последней части пути (к имени файла)
 * @param {string} filePath исходный путь
 * @param {string} prefix префикс без разделителя
 * @param {string} delimiter разделитель префикса и старого имени
 * @returns {string} новый путь
 */
function prefixFileName(filePath, prefix, delimiter = '_') {
  const pos = filePath.lastIndexOf(path.sep) + 1
  return pos > 0
    ? filePath.slice(0, pos) + prefix + delimiter + filePath.slice(pos)
    : filePath + delimiter + prefix
}

/**
 * Определить дату в прошлом по заданному интервалу от текущей
 * @param {string} timeInterval Интервал вида число + первая буква от month|week|day|second
 * @returns {string} Строка даты-времени (UTC)
 */
function findDateTime(timeInterval) {
  const [, num, letter] = timeInterval.match(/^(\d+)([mwds])$/) || []
  if (!letter) return ''

  const dt = new Date()
  if (letter === 'm') {
    dt.setMonth(dt.getMonth() - num)
    return dt.toISOString().substr(0, 7)
  }

  if (letter === 's') {
    dt.setSeconds(dt.getSeconds() - num)
    return dt.toISOString().substr(0, 19)
  }

  dt.setDate(dt.getDate() - num * (letter === 'w' ? 7 : 1))
  return dt.toISOString().substr(0, 10)
}

/**
 * Удалить файлы, не изменявшиеся после указанной даты
 * @param {string} dir
 * @param {string} datetime
 */
function deleteOldFiles(dir, datetime) {
  console.log(`Delete files older than ${datetime} (UTC) from ${dir}:`)
  fs.readdirSync(dir)
    .filter((name) => logsPattern.test(name))
    .forEach((name) => {
      const file = path.join(dir, name)
      const stat = fs.statSync(file)
      const mtime = stat.mtime.toISOString()
      if (mtime < datetime) {
        fs.unlinkSync(file)
        console.log(name, mtime, 'DELETED')
      } else {
        console.log(name, mtime, 'skip')
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

    const now = new Date().toISOString().substr(0, 19).replace(/:/g, '-')
    // 2020-12-31T12-34-56 (UTC)

    let dirs = new Set()

    apps.forEach(function (app) {
      // console.log(app.pm2_env)
      const { name, pm_out_log_path: logPath } = app.pm2_env
      dirs.add(path.dirname(logPath))
      const newPath = prefixFileName(logPath, now)
      fs.renameSync(logPath, newPath)
      console.log(`${name} ${newPath}`)
    })
    pm2.reloadLogs()
    pm2.disconnect()

    const args = process.argv.slice(2)
    const dt = findDateTime(args[0] || '10w')
    if (dt) {
      for (const dir of dirs) {
        deleteOldFiles(dir, dt)
      }
    }

    console.log('OK')
  })
})
