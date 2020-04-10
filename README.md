# vuex-press
vuex store helper functions

## set(state, payload)
A general purpose mutation function that should cover the majority of use cases
### Setup
```
// store/*.js
import { set } from 'vuex-press'

export const mutations = {
  set
}
```
### Usage
```
// Set a value
this.$store.commit('<store-name>/set', {path: value})
e.g. this.$store.commit('user/set', {'name.firstName': 'David', 'name.lastName': 'Chu'})

// Push array
this.$store.commit('<store-name>/set', {path[]: value})
e.g. this.$store.commit('family/set', { 'father.children[]': {name: { firstName: 'Little', lastName: 'Chu'}}})

// Query for item in array before setting value
this.$store.commit('<store-name>/set', {path[query]: value})
e.g. this.$store.commit('family/set', {'father.children[{'name.firstName': 'Little'}].name.firstName': 'Danny'})

// Increment a value
this.$store.commit('<store-name>/set', {path: { $inc: value}})
this.$store.commit('family/set', {'father.children_count': { $inc: 1 }})
```
