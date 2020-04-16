
import Vue from './Vue.js'
import { fSet } from './../src/lib/set.js'
import assert from 'assert'

const set = fSet(Vue)

const main = () => {
    let state = {}

    set(state, {'one': 1})
    assert.deepEqual(state.one, 1)
    
    set(state, {'one': {$inc: 5}})
    assert.deepEqual(state.one, 6)

    set(state, {'one': {$dec: 5}})
    assert.deepEqual(state.one, 1)

    set(state, {'one': {}})
    assert.deepEqual(state.one, {})

    set(state, {'one': []})
    assert.deepEqual(state.one, [])

    set(state, {'one[]': 1})
    assert.deepEqual(state.one[0], 1)
     
    set(state, {'one[]': 2})
    assert.deepEqual(state.one[1], 2)

    set(state, {'one[0]': {id: 1}})
    assert.deepEqual(state.one[0], {id: 1})

    set(state, {'one[1]': {id: 2}})
    assert.deepEqual(state.one[1], {id: 2})

    set(state, {'one[{"id":1}]': {id: 3}})    
    assert.deepEqual(state.one[0], {id: 3})

    set(state, {'one[{"id":2}]': {id: 4}})    
    assert.deepEqual(state.one[1], {id: 4})

    set(state, {'one[{"id":3}].id': {$dec: 2}})    
    assert.deepEqual(state.one[0], {id: 1})

    set(state, {'one[{"id":4}].id': {$inc: 6}})    
    assert.deepEqual(state.one[1], {id: 10})

    set(state, {'one[{"id":10}].id2': 'obj'})    
    assert.deepEqual(state.one[1], {id: 10, id2: 'obj'})

    // Multiple field query
    set(state, {'one[{"id":10,"id2":"obj"}].id': 11})    
    assert.deepEqual(state.one[1], {id: 11, id2: 'obj'})
    
    // Push on array matrix
    set(state, {'two': []})
    set(state, {'two[]': []})
    set(state, {'two[0][]': 1})
    assert.deepEqual(state.two[0][0], 1)

    // Set on array matric
    set(state, {'two[0][0]': 2})
    assert.deepEqual(state.two[0][0], 2)

    /*** These Tests Should Fail ***/
    set(state, {one: 1, two: 'two', three: [], four: [{a: 1, b: 'b', c: 2}], five: {a: {}}})
    const state_copy = Object.assign({}, state)

    // Numeric operator on non number
    set(state, {'two': {$inc: 1}})
    assert.deepEqual(state, state_copy)

    set(state, {'two': {$dec: 1}})
    assert.deepEqual(state, state_copy)

    // Try access a property that doesn't exist
    set(state, {'five.b': 1})
    assert.deepEqual(state, state_copy)

    // Push using numeric index
    set(state, {'three[0]': {dec: 1}})
    assert.deepEqual(state, state_copy)

    // Query with one incorrect field
    set(state, {'four[{"a":1, "b":"c"}]': {}})
    assert.deepEqual(state, state_copy)
    console.log(JSON.stringify(state_copy));
    
    return
}

main()