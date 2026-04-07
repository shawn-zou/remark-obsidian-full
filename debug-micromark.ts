import * as micromark from 'micromark'

console.log('micromark exports:', Object.keys(micromark))
console.log('parse function signature:', micromark.parse.toString().slice(0, 100))
