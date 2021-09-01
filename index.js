// const interval = 1000 + Math.floor(Math.random() * 4000) // slow
const interval = 2 + Math.floor(Math.random() * 10) // fast
console.log('Interval: %d ms', interval)

let value = 0

setInterval(() => {
  console.log('%s Value: %d', new Date().toISOString(), value++)
}, interval)
