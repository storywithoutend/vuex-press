/*** Functional Helpers ***/
// I usually use ramdajs to build functions, but didn't want to create another dependency.
// Created these basic functions as building blocks

// Composition
const pipe = (...fs) => fs.reduce((a, b) => arg => b(a(arg)))

// Logic
const cond = ps => a => ps.find(p => p[0](a))[1](a)
const ifElse = (fCond, fTrue, fFalse) => a => (fCond(a) ? fTrue(a) : fFalse(a))
const when = (fCond, fTrue) => ifElse(fCond, fTrue, identity)
const tryCatch = (f, fCatch ) => x => { try { let y = f(x); return y; } catch { return fCatch(x) } }  
const always = a => () => a
const and = (f1, f2) => x => f1(x) ?  f2(x) : false

// General
const throws = a => () => { throw a }
const identity = a => a
const equals = a => b => a == b
const unequals = a => b => a !== b
const exists = x => typeof x != 'undefined' && x != null
const notExists = x => !exists(x)
const length = a => a.length

// String
const firstChar = s => s.charAt(0)
const lastChar = s => s.charAt(s.length - 1)
const split = a => b => b.split(a)
const indexOfAll = c => s =>  {
  var i = s.indexOf(c),
    idxs = []
  while (i !== -1) {
    idxs.push(i)
    i = s.indexOf(c, ++i)
  }
  return idxs
}

// Object
const hasProp = prop => o => exists(o[prop])
const isObjectWithProp = prop => and(isObject, hasProp(prop))
const objectHas = o => prop => exists(o[prop])
const objectProp = o => prop => o[prop]
const keys = a => Object.keys(a)

// Arrays
const map = f => a => a.map(f)
const every = f => a => a.every(f)
const concat = (a, b) => a.concat(b)
const flatMap = f => pipe(map(f), reduce(concat, []))
const findIndex = f => a => a.findIndex(f)
const some = f => a => a.some(f)
const includes = a => x => a.includes(x)
const reduce = (f, x) => a => a.reduce(f, x)
const trace = label => x => { console.log(label, x); return x; }

// Types
const isJsonString = tryCatch(x => JSON.parse(x), always(false))
const stringToJson = s => JSON.parse(s)
const isArray = x => Array.isArray(x)
const isObject = x => x && typeof x == 'object' && !Array.isArray(x)
const isNumber = x => !notNumber(x)
const notNumber = x => isNaN(x)
const isStringInteger = s => !isNaN(stringToInt(s))
const stringToInt = s => parseInt(s, 10)


/*** Path & Subpath Functions ***/

// subpath => Boolean
// Checks if string starts with '[' and ends with ']'
const isIndexString = and(pipe(firstChar, equals('[')), pipe(lastChar, equals(']')))

// [subpath] => Index
// Find the index of the first subpath that is an index string
// If no index string is found, returns the length of the array
const findIndexOfArrayIndice = pipe(findIndex(isIndexString), ifElse(equals(-1), length, identity))

// subpath => [subpath, subpath, subpath]
// Searches the subpath string for '[' characters and splits the string at those positions
const splitArraySubpath = subpath => {
  const idxs = concat([0], indexOfAll('[')(subpath))
  return idxs.map((idx, i, idxs) => exists(idxs[i+1]) ? subpath.substring(idx, idxs[i+1]) : subpath.substring(idx))
}

// path => [subpath]
// Splits a path string into an array of subpaths
const pathToSubpaths = pipe(split('.'), flatMap(splitArraySubpath))

// path => { [subpath], [subpath] }
const pathToPrePostArraySubpaths = path => {  
  let subpaths = pathToSubpaths(path),
  index = findIndexOfArrayIndice(subpaths),
  pre = subpaths.slice(0, index),
  post = subpaths.length <= 1 ? [] : subpaths.slice(index)      
  return { pre, post }
}

/*** Node Functions ***/

// node -> prop => node
// Checks if property exists on object and throw an error if it does not
const hasPropOrThrow = node => ifElse(objectHas(node), identity, throws('attempted to access an array index that does not exist')) 

// node -> query => index
// Searches elements in node array for element that matches query
const queryToIndex = node => query => node.findIndex(item => Object.keys(query).every(key => item[key] == query[key]))

// node -> "[]" => index
// Converts the string representing the array index into the actual index
// Empty array indexes are set to next empty index
// Checks that index is valid before passing value
const indexStringToIndex = node => pipe(
  s => s.slice(1, -1),
  cond([
    [equals(''), always(length(node))],
    [equals('0'), pipe(always(0), hasPropOrThrow(node))],
    [isStringInteger, pipe(stringToInt, hasPropOrThrow(node))],
    [isJsonString, pipe(stringToJson, queryToIndex(node), hasPropOrThrow(node))],
    [always(true), throws('Could not interpret prop subpath')]
  ])
)

// node => node
// Create a shallow clone
const clone = cond([
  [isArray, x => Object.assign([], x)],
  [isObject, x => Object.assign({}, x)],
  [always(true), throws('tried to clone non-clonable variable')]
])

// (node, subpath) => node
// Get the child node
const childFromNodeAndPath = (node, path) => pipe(when(isIndexString, indexStringToIndex(node)), ifElse(objectHas(node), objectProp(node), throws(`asdf`)))(path)

// (node, [subpath]) => node
// get the terminal node following an array of subpaths
const nodeFromRootNodeAndSubPaths = (rootNode, subpaths) => subpaths.reduce(childFromNodeAndPath, rootNode)

// node -> subpath => index
// Evaluate the prop subpath for the final value
const propSubpathToProp = node => ifElse(isIndexString, indexStringToIndex(node), identity)

const nodeAndPropFromRootNodeAndSubpaths = (rootNode, subpaths) => {  
  const nodeSubpaths = subpaths.slice(0, -1),
    propSubpath = subpaths.slice(-1)[0]    
  const node = nodeFromRootNodeAndSubPaths(rootNode, nodeSubpaths)  
  const prop = propSubpathToProp(node)(propSubpath)
  return { node, prop}
}

/*** Operator Functions ***/

// Variables
const numericalOperators = ['$inc', '$dec']
const operators = Object.assign([], numericalOperators)

// operator -> value => Boolean
// Checks if value object has specific operator 
const hasOperator = and(isObject, pipe(keys, some(includes(operators))))

// value => Boolean
// Checks if every key on value is a numeric operator
const isNumericOperator = pipe(keys, every(includes(numericalOperators)))

// node value -> value => x
// Checks to make sure the operator type and value it is changing is the right type
const validateOperator = current_value => cond([
  [and(isNumericOperator, always(isNumber(current_value))), identity],
  [always(true), throws('attempted an operator on a value of wrong type')]
])

// node value -> value = final value
// Perform the value manipulation
const operatorToValue = current_value => cond([
  [always(notExists(current_value)), identity],
  [isObjectWithProp('$inc'), x => current_value + x['$inc']],
  [isObjectWithProp('$dec'), x => current_value - x['$dec']],
  [always(true), throws('could not process operator')]
])

// value -> node value => final value
// Determine what type of value is being passed and return final value
const payloadToValue = current_value => cond([
  [hasOperator, pipe(validateOperator(current_value), operatorToValue(current_value))],
  [always(true), identity],
])

// Get the target, property, and value variables needed to perform Vue.set
const getVueSetVariables = (state, path, value) => {
  const { pre: preSubpaths, post: postSubpaths } = pathToPrePostArraySubpaths(path)    
  const { node: t, prop: p } = nodeAndPropFromRootNodeAndSubpaths(state, preSubpaths)
  
  // If there is no array, then process the value and return
  if (postSubpaths.length == 0){
    const v = payloadToValue(t[p])(value)
    return {t, p, v}
  }

  // If there is an array then the value becomes the 
  const v = clone(t[p])
  const { node, prop } = nodeAndPropFromRootNodeAndSubpaths(v, postSubpaths)  
  const newValue = payloadToValue(node[prop])(value)
  node[prop] = newValue
  return { t, p, v}
}

// Create the set method depending on which Vue object
// testing : will provide a fake Vue object with set variable
// nuxt: project will need to have Vue installed
export const fSet = Vue => function(state, payload){
  for (const path in payload) {
    try {
      let value = payload[path]
      let { t, p, v } = getVueSetVariables(state, path, value)          
      Vue.set(t, p, v)
    } catch (error) {
      console.error(error)
    }
  }
}

