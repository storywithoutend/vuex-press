const Vue = require('vue');

const indexStringToEvent = str => {
    if (str == '') return { type: 'push' }
    else if (str == '0') return { type: 'update', value: 0 }
    else if (!isNaN(parseInt(str, 10)))
      return { type: 'update', value: parseInt(str, 10) }
    else if (isJsonString(str)) return { type: 'query', value: JSON.parse(str) }
    else throw 'func indexStringToEvent: could not parse ' + str
}

const isJsonString = str => {
    try {
      JSON.parse(str)
    } catch (error) {
      return false
    }
    return true
}
  
const queryToIndex = (query, arr) => {
    let index = arr.findIndex(item => {
      for (const key in query) {
        const value = query[key]
        if (item[key] != value) return false
      }
      return true
    })
    return index
}
  
const cloneNode = node => {
    if (node == null) throw 'cloneNode got null'
    if (Array.isArray(node)) return Object.assign([], node)
    else if (typeof node == 'object') return Object.assign({}, node)
    else throw 'cloneNode: unhandled type'
}

const set = function(state, data) {
  for (const path in data) {
    try {
      let value = data[path]

      // No special ops needed
      if (state.hasOwnProperty(path)) {
        state[path] = value
        continue
      }

      const subpaths = path.split('.')

      let node = state
      let vueset = null

      // Subpath loop
      for (let index = 0; index < subpaths.length; index++) {
        const subpath = subpaths[index]
        const isLast = index == subpaths.length - 1

        if (node.hasOwnProperty(subpath)) {
          if (
            isLast &&
            typeof value == 'object' &&
            value.hasOwnProperty('$inc')
          ) {
            let inc = value['$inc']
            value = node[subpath]
            value = value + inc
          }
          if (isLast) node[subpath] = value
          else node = node[subpath]
          continue
        }

        const subpath_matches = subpath.match(/^(.*)\[([^\]]*)\]$/)
        if (subpath_matches == null) {
          throw path + ': store does not have subpath ' + subpath
        }

        const basepath = subpath_matches[1]
        if (!node.hasOwnProperty(basepath)) {
          throw path + ': could not find ' + basepath
        }

        const index_string = subpath_matches[2]
        let event = indexStringToEvent(index_string)

        if (event.type == 'push' && !isLast) {
          throw path + ': can not push array if not last subpath'
        }

        if (event.type == 'query') {
          let newIndex = queryToIndex(event.value, node[basepath])
          if (newIndex == -1)
            throw path + ': could not find query ' + index_string
          event = {
            type: 'update',
            value: newIndex
          }
        }

        if (event.type == 'push') {
          let items = node[basepath]
          if (Array.isArray(value)) items.push(...value)
          else items.push(value)
          node[basepath] = items
          continue
        }

        if (event.type == 'update' && vueset == null) {
          vueset = {}
          vueset.idx = event.value
          vueset.tgt = node[basepath]
          node = cloneNode(node[basepath][event.value])
          if (
            isLast &&
            typeof value == 'object' &&
            value.hasOwnProperty('$inc')
          ) {
            let inc = value['$inc']
            value = node[basepath][event.value]
            value = value + inc
          }
          vueset.val = isLast ? value : node
          continue
        }

        if (event.type == 'update') {
          node = node[basepath][event.value]
          continue
        }

        throw path + ': reached end of subpath look without resolvement'
      } // Subpath loop

      if (vueset != null) {
        let { tgt, idx, val } = vueset
        Vue.set(tgt, idx, val)
      }
    } catch (error) {
      console.error(error.message || error)
    }
  }
}

module.exports = set