/* ============================================================
Suththa.org — tree.js
Optimized Tripitaka tree index
Compatible replacement for original tree.js
============================================================ */

(function () {
'use strict'

const utils = Suththa.utils
const config = Suththa.config

// -----------------------------------------------------------
// State
// -----------------------------------------------------------

const state = {
index: {},
treeView: [],
filterTree: [],
orderedKeys: [],
isLoaded: false,
}

// -----------------------------------------------------------
// Original child ordering
// -----------------------------------------------------------

function childInd(key) {
const parts = key.split('-')
return parseInt(parts[parts.length - 1], 10)
}

function childrenSort(a, b) {
const ac = childInd(a.key)
const bc = childInd(b.key)


if (isNaN(ac) || isNaN(bc)) return 0

return ac - bc


}

// -----------------------------------------------------------
// Generate tree
//
// This keeps the original tree structure and behavior.
// -----------------------------------------------------------

function genTree(key, addChildren, letterOpt) {
const item = state.index[key]


if (!item) return null

const pali = utils.beautifyText(
  item.pali,
  'pali',
  letterOpt
)

const sinh =
  utils.beautifyText(
    item.sinh,
    'sinh',
    letterOpt
  ) || pali

const treeItem = {
  pali: pali,
  sinh: sinh,
  key: key,
  children: [],
}

if (
  item.children &&
  item.children.length &&
  addChildren(key)
) {
  treeItem.children = item.children
    .map(function (childKey) {
      return genTree(
        childKey,
        addChildren,
        letterOpt
      )
    })
    .filter(Boolean)
    .sort(childrenSort)
}

return treeItem


}

// -----------------------------------------------------------
// Reading order
// -----------------------------------------------------------

function addOrder(treeItem, list) {
if (!treeItem) return


list.push(treeItem.key)

if (
  treeItem.children &&
  treeItem.children.length
) {
  treeItem.children.forEach(function (child) {
    addOrder(child, list)
  })
}


}

// -----------------------------------------------------------
// Build index
// -----------------------------------------------------------

function setIndex(jTree) {
const index = {
root: {
children: [],
},
}


if (!jTree || typeof jTree !== 'object') {
  state.index = index
  return
}

// ---------------------------------------------------------
// First pass:
// create every node
// ---------------------------------------------------------

Object.keys(jTree).forEach(function (key) {
  const arr = jTree[key]

  if (!Array.isArray(arr)) return

  index[key] = {
    pali: arr[0],
    sinh: arr[1],
    level: arr[2],
    eInd: arr[3],
    parent: arr[4],
    filename: arr[5],
    key: key,
    children: [],
  }
})

// ---------------------------------------------------------
// Second pass:
// connect children to parents
// ---------------------------------------------------------

Object.keys(jTree).forEach(function (key) {
  const item = index[key]

  if (!item) return

  const parent = item.parent || 'root'

  if (!index[parent]) {
    index[parent] = {
      children: [],
    }
  }

  index[parent].children.push(key)
})

/*
 * IMPORTANT:
 *
 * Do NOT sort the raw index children here.
 *
 * The original tree.json ordering is preserved.
 * genTree() performs the same sorting as the original
 * implementation when creating treeView.
 */

state.index = index


}

// -----------------------------------------------------------
// Recompute tree
// -----------------------------------------------------------

function recomputeTree(letterOpt) {
state.treeView = []
state.filterTree = []
state.orderedKeys = []


const roots =
  state.index.root &&
  state.index.root.children
    ? state.index.root.children
    : []

// ---------------------------------------------------------
// Full sidebar tree
// ---------------------------------------------------------

roots.forEach(function (key) {
  const item = genTree(
    key,
    function () {
      return true
    },
    letterOpt
  )

  if (item) {
    state.treeView.push(item)
  }
})

// ---------------------------------------------------------
// Filter tree
// ---------------------------------------------------------

const filterParents =
  config.filterTreeParents || []

roots.forEach(function (key) {
  const item = genTree(
    key,
    function (k) {
      return filterParents.indexOf(k) !== -1
    },
    letterOpt
  )

  if (item) {
    state.filterTree.push(item)
  }
})

// ---------------------------------------------------------
// Reading order
// ---------------------------------------------------------

state.treeView.forEach(function (root) {
  addOrder(
    root,
    state.orderedKeys
  )
})

state.isLoaded = true


}

// -----------------------------------------------------------
// Get name
// -----------------------------------------------------------

function getName(key, language, settings) {
const item = state.index[key]


if (!item) {
  return 'key not found'
}

const lang =
  language ||
  (
    settings &&
    settings.treeLanguage
  ) ||
  'sinh'

const raw = item[lang]

return utils.beautifyText(
  raw,
  lang,
  settings
)


}

// -----------------------------------------------------------
// Get key by filename + eInd
// -----------------------------------------------------------

function getKeyForEInd(filename, eInd) {
let i =
state.orderedKeys.length - 1


for (; i >= 0; i--) {
  const key =
    state.orderedKeys[i]

  const item =
    state.index[key]

  if (!item) continue

  if (
    item.filename === filename &&
    utils.isEIndLessEqual(
      item.eInd,
      eInd
    )
  ) {
    break
  }
}

return i >= 0
  ? state.orderedKeys[i]
  : ''


}

// -----------------------------------------------------------
// Initialize
// -----------------------------------------------------------

async function initialize() {
const index =
await utils.getJson(
config.treeDataUrl
)


setIndex(index)

recomputeTree(
  Suththa.store.settings
)

return state


}

// -----------------------------------------------------------
// Public API
// -----------------------------------------------------------

Suththa.tree = {
state: state,


initialize: initialize,

setIndex: setIndex,

recomputeTree: recomputeTree,

getName: getName,

// O(1) lookup
getKey: function (key) {
  return state.index[key]
},

getKeyForEInd:
  getKeyForEInd,


}

})()
