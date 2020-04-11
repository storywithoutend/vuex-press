# vuex-press
Build prototypes faster with these helper functions designed to work with the vuex store

**WARNING:** I recently rewrote the whole this package to a more functional programming style and to structure it so that new features could easily be added in the future. I haven't personally used it in a project yet so their may be some bugs I haven't found.

## set(state, payload)
Super useful for when data structures are constantly changing. A general purpose mutation function that should cover the majority of use cases and also feature useful features such as querying objects in an array. Makes liberal use of Vue.set so that new properties are observable as well as changes to arrays
### Setup
```
// store/*.js
import { set } from 'vuex-press'

export const mutations = {
  set
}
```
### Arguments
**payload** accepts a json object where the *key* is the *path* to the variable and the *value* is either the value to be set or an *operator* that adjusts the value. Multiple key/value pairs can be sent at one time.

**path** is a dot-notated string representing the variable you want to change. Array indices are represented using "[]" and can be blank to push a new value, contain an interger to represent the index, or a query object to search for a specific object.

**value** is the new value of the varible or an operator to increase or decrease the value of the variable.

### Examples
```
// Change the user's friendly name
this.$store.commit('user/set', {'friendly_name': 'New Name'})

// Add a new post
this.$store.commit('posts/set', { items[]: {{ post data }}})

// Change the title of a post
let query = JSON.stringify({id: 1})
this.$store.commit('posts/set', { [`items.[${query}].title`]: 'New Title' })

// Increment like count on a post by 1
let query = JSON.stringify({id: 1})
this.$store.commit('posts/set', { [`items.[${query}].like_count`]: { $inc: 1}})

// Decrease follower count by 1
this.$store.commit('user/set', { followers: { $dec: 1 }})
```
