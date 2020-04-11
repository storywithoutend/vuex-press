import Vue from 'vue'

const isJsonString = str => {
    try {
      JSON.parse(str)
    } catch (error) {
      return false
    }
    return true
}

const cloneNode = node => {
  if (node == null) throw 'cloneNode got null'
  if (Array.isArray(node)) return Object.assign([], node)
  else if (typeof node == 'object') return Object.assign({}, node)
  else throw 'cloneNode: unhandled type'
}

// Path functions
const splitArrayPaths = p => {
  let index = p.indexOf('[')
  return index == -1 ? p : [p.substring(0, index), p.substring(index)]
}
const concatArray = (acc, val) => acc.concat(val)
const convertPathToSubpathsArray = path => path.split('.').map(splitArrayPaths).reduce(concatArray, [])

const isArrayIndice = subpath => subpath[0] == '['
const findIndexOfArrayIndice = subpaths => {
  let index = subpaths.findIndex(isArrayIndice)
  return index == -1 ? subpaths.length : index
}
const convertPathToSubpaths = p => {
  let subpaths = convertPathToSubpathsArray(p),
    index = findIndexOfArrayIndice(subpaths),
    target = subpaths.slice(0, index),
    prop = target.pop(),
    value = subpaths.slice(index)
  return { target, prop, value}
}

// Get node from path
const objectShareValues = a => b => {
  for (const key in a) {
    if (a[key] != b[key]) return false
  }
  return true
}
const queryToIndex = (query, arr) => {
  const objectMatchesQuery = objectShareValues(query)
  let index = arr.findIndex(objectMatchesQuery)
  if (index == -1) throw 'query did not match any object'
  return index
}
const indiceExists = (node, indice) => typeof node[indice] !== 'undefined'
const convertIndiceStringToIndex = (node, indiceString) => {
  let indice = indiceString.slice(1, -1)
  if (indice == "") indice = node.length
  else if (indice == '0') indice = 0
  else if (!isNaN(parseInt(indice, 10))) indice = parseInt(indice, 10) 
  else if (isJsonString(indice)) indice = queryToIndex(JSON.parse(indice), node)
  else throw 'Could not interpret indice ' + indiceString
  return indice
}
const getNodeFromArrayIndice = (node, indiceString) => {
  let indice = convertIndiceStringToIndex(node, indiceString)
  if (!indiceExists(node, indice)) throw 'array does not have index ' + indice
  return node[indice]
}
const getNodeFromPath = (node, path) => {
  if (node.hasOwnProperty(path)) return node[path]
  if (isArrayIndice(path)) return getNodeFromArrayIndice(node, path)
}
const getNodeFromPathArray = (node, subpaths) => subpaths.reduce(getNodeFromPath, node)
const convertPropSubpathToProp = (node, subpath) => {
  if (isArrayIndice(subpath)) return convertIndiceStringToIndex(node, subpath)
  else return subpath
}

// Value Operators
const operatorNumericalKeys = ['$inc', '$dec']
const operatorKeys = Object.assign([], operatorNumericalKeys)
const isOperator = value => value && typeof value == 'object' && Object.keys(value).some(key => operatorKeys.includes(key))
const getOperator = value => Object.keys(value).find(key => operatorKeys.includes(key))
const getValueFromOperator = (node, prop, value) => {
  let key = getOperator(value)
  if (operatorNumericalKeys.includes(key) && isNaN(node[prop])) throw `attempted operator ${key} on a value that is not a number`
  if (key == '$inc') return node[prop] + value['$inc']
  else if (key == '$dec') return node[prop] - value['$dec']
}

const getVueSetVariable = (state, value, subpaths) => {
  let t = getNodeFromPathArray(state, subpaths.target)
  let p = convertPropSubpathToProp(t, subpaths.prop)
  if (subpaths.value.length == 0){
    let v = isOperator(value) ? getValueFromOperator(t, subpaths.prop, value) : value
    return {t, p, v}
  }
  
  let v = cloneNode(t[p])
  let v_path = subpaths.value
  let v_propPath = v_path.pop()
  let node = getNodeFromPathArray(v, v_path)
  let v_prop = convertPropSubpathToProp(node, v_propPath)
  let v_value = isOperator(value) ? getValueFromOperator(node, v_prop, value) : value
  node[v_prop] = v_value
  return { t, p, v}
}

export const set = function(state, payload){
  for (const path in payload) {
    try {
      let value = payload[path], 
        subpaths = convertPathToSubpaths(path),
        { t, p, v } = getVueSetVariable(state, value, subpaths)      
      Vue.set(t, p, v)
    } catch (error) {
      console.error(error)
    }
  }
}

