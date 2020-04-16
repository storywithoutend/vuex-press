# vuex-press
vux-press is a library of reusable general purpose functions for the vuex store.

## Contents
1. **set**: a general purpose mutation function

## set(state, payload)
A general purpose mutation function designed to handle the majority of changes you will need to make in the vuex store. The function has 3 primary features:
- *Observable* - Changes to arrays and new properies are always observable.
- *Querying* - Queries can be used in place of an index to find an object in an array.
- *Operators* - Operators make changes based on the current value.

### Setup
```
// store/*.js
import { set } from 'vuex-press'

export const mutations = {
  set
}
```

### Payload
```
{ <path|query> : <value|operator> }
```
- *path* - A dot-bracket notated string leading to the property to be changed. (e.g. 'path.t[0].the.property')
- *query* - A stringified json object with key-value pairs of an object in an array
- *value* - The new value of the property
- *operator* - An object with a key-value pair that represents an operation to be performed on the value

### Operators
```
{ <operator-type> : <operator-value> }
```
- **$inc** - increases the current value by the operator value
- **$dec** - decreases the current value by the operator value

### Examples
**Set a new value**
```
// Change a the user's friendly name
this.$store.commit('user/set', {'friendly_name': 'New Name'})
```
**Push item to an array**
```
// Add a post to to an array of posts
this.$store.commit('posts/set', { items[]: {<post data>}})
```
**Find an item using a query and change a property**
```
// Change the title of a post
let query = JSON.stringify({id: 1})
this.$store.commit('posts/set', { [`items.[${query}].title`]: 'New Title' })
```
**Increment a value using an operator**
```
// Increment like count on a post by 1
let query = JSON.stringify({id: 1})
this.$store.commit('posts/set', { [`items.[${query}].like_count`]: { $inc: 1}})
```
**Decrement a value using an operator**
```
// Decrease follower count by 1
this.$store.commit('user/set', { followers: { $dec: 1 }})
```
