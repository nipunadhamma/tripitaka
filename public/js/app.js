
/* ============================================================
   Suththa.org — app.js (reader page boot & UI logic)
   ============================================================ */

(function () {
  'use strict'

  const utils = Suththa.utils
  const config = Suththa.config
  const store = Suththa.store
  const tree = Suththa.tree
  const reader = Suththa.reader
  const search = Suththa.search
  const dict = Suththa.dictionary

  const treeFilters = [
    { key: 'all', label: 'සියල්ල' },
    { key: 'vp', label: 'විනය' },
    { key: 'dn', label: 'දීඝ' },
    { key: 'mn', label: 'මජ්ඣිම' },
    { key: 'sn', label: 'සංයුත්ත' },
    { key: 'an', label: 'අඞ්ගුත්තර' },
    { key: 'kn', label: 'ඛුද්දක' },
    { key: 'ap', label: 'අභිධම්ම' },
    { key: 'atta', label: 'අට්ඨ' },
    { key: 'anya', label: 'අනෙකුත්' },
  ]

  // -------------------------------------------------------------
  // sidebar tree
  // -------------------------------------------------------------

  let currentTreeFilter = 'all'

  /*
   * Find a tree item inside the already-built treeView.
   *
   * This is only used when a group is opened or when an active
   * path needs to be expanded. It is NOT used while rendering
   * every node.
   */
  function findTreeItem(items, key) {
    if (!items || !items.length) return null

    for (let i = 0; i < items.length; i++) {
      const item = items[i]

      if (item.key == key) {
        return item
      }

      if (item.children && item.children.length) {
        const found = findTreeItem(item.children, key)

        if (found) {
          return found
        }
      }
    }

    return null
  }


  /*
   * Create HTML for ONE tree node only.
   *
   * Important:
   * Children are NOT rendered here.
   * This prevents the whole 16,000+ node tree from becoming
   * DOM elements during initial page load.
   */
  function treeItemHtml(item) {
    const hasChildren =
      item.children && item.children.length > 0

    const label =
      tree.getName(item.key, null, store.settings)

    return (
      '<li class="tree-node">' +

        '<div class="tree-item" ' +
          'data-key="' + item.key + '"' +
          (hasChildren
            ? ' data-group="1"'
            : ' data-leaf="1"') +
        '>' +

          (
            hasChildren
              ? '<span class="tree-arrow">▸</span>'
              : '<span class="tree-dot">•</span>'
          ) +

          '<span class="tree-label">' +
            utils.escapeHtml(label) +
          '</span>' +

        '</div>' +

      '</li>'
    )
  }


  /*
   * Render children only when the user opens a group.
   */
  function renderTreeChildren(item, parentLi) {
    if (!item || !item.children || !item.children.length) {
      return
    }

    /*
     * Do not rebuild children if they have already been rendered.
     */
    const existing =
      parentLi.querySelector(':scope > .tree-list')

    if (existing) {
      return
    }

    const ul = document.createElement('ul')
    ul.className = 'tree-list'

    item.children.forEach(function (child) {
      const temp = document.createElement('div')

      temp.innerHTML = treeItemHtml(child)

      const li = temp.firstElementChild

      if (li) {
        ul.appendChild(li)
      }
    })

    parentLi.appendChild(ul)
  }


  /*
   * Open / close one group.
   */
  function toggleTreeGroup(itemElement) {
    const key = itemElement.dataset.key

    const treeItem =
      findTreeItem(tree.state.treeView, key)

    if (!treeItem) return

    const parentLi =
      itemElement.closest('.tree-node')

    if (!parentLi) return

    const isOpen =
      itemElement.classList.contains('open')

    if (isOpen) {
      itemElement.classList.remove('open')
      return
    }

    /*
     * Children are created only now.
     */
    renderTreeChildren(treeItem, parentLi)

    itemElement.classList.add('open')
  }


  /*
   * Render only the root level initially.
   */
  function renderTree() {
    const el = document.getElementById('tree')

    if (!el) return

    let roots = tree.state.treeView

    if (currentTreeFilter != 'all') {
      roots = roots.filter(function (r) {
        const key = r.key

        if (currentTreeFilter == 'atta') {
          return key.indexOf('atta-') == 0
        }

        return key == currentTreeFilter
      })
    }

    if (!roots.length) {
      el.innerHTML =
        '<div class="muted small">ග්‍රන්ථ නැත</div>'

      return
    }

    /*
     * IMPORTANT:
     * Only root nodes are inserted here.
     *
     * The old implementation recursively inserted every child.
     */
    el.innerHTML =
      '<ul class="tree-list">' +
        roots.map(function (item) {
          return treeItemHtml(item)
        }).join('') +
      '</ul>'

    expandToActive()
  }


  /*
   * Expand the group immediately containing the active reader item.
   *
   * This preserves the old behaviour while using lazy rendering.
   */
  function expandToActive() {
    const key = reader.getActiveKey()

    if (!key) return

    const parts = key.split('-')

    if (parts.length < 2) return

    const groupKey =
      parts.slice(0, parts.length - 1).join('-')

    const group =
      document.querySelector(
        '.tree-item[data-group][data-key="' +
        groupKey +
        '"]'
      )

    if (!group) return

    const treeItem =
      findTreeItem(tree.state.treeView, groupKey)

    if (!treeItem) return

    const parentLi =
      group.closest('.tree-node')

    if (parentLi) {
      renderTreeChildren(treeItem, parentLi)
    }

    group.classList.add('open')
  }


  /*
   * Event delegation.
   *
   * Only ONE click listener is attached to the tree container.
   */
  function bindTree() {
    const el = document.getElementById('tree')

    if (!el) return

    el.addEventListener('click', function (e) {
      const item =
        e.target.closest('.tree-item')

      if (!item) return

      const key = item.dataset.key

      /*
       * Group node
       */
      if (item.hasAttribute('data-group')) {
        toggleTreeGroup(item)
        return
      }

      /*
       * Leaf node
       */
      const itemData =
        tree.getKey(key)

      reader.openTab({
        key: key,
        language: store.settings.treeLanguage,
        eInd: itemData
          ? itemData.eInd
          : null,
      })
    })
  }


  /*
   * Tree category filters.
   */
  function bindTreeFilters() {
    const el =
      document.getElementById('tree-filters')

    if (!el) return

    el.innerHTML =
      treeFilters.map(function (f) {
        return (
          '<button class="chip' +
          (f.key == currentTreeFilter
            ? ' active'
            : '') +
          '" data-filter="' +
          f.key +
          '">' +
          f.label +
          '</button>'
        )
      }).join('')

    el.addEventListener('click', function (e) {
      const btn =
        e.target.closest('.chip')

      if (!btn) return

      currentTreeFilter =
        btn.dataset.filter

      el.querySelectorAll('.chip')
        .forEach(function (c) {
          c.classList.toggle(
            'active',
            c === btn
          )
        })

      renderTree()
    })
  }


  // -------------------------------------------------------------
  // header search
  // -------------------------------------------------------------

  function injectSearchBox() {
    const slot =
      document.getElementById('header-search-slot')

    if (!slot) return

    slot.innerHTML =
      '<div class="search-area-inner">' +

        '<div id="search-box">' +

          '<div class="search-input-wrap">' +
            '<input id="search-input" ' +
              'class="search-input" ' +
              'type="search" ' +
              'placeholder="ග්‍රන්ථ නම සොයන්න…" ' +
              'autocomplete="off">' +
          '</div>' +

          '<button id="search-dict-btn" ' +
            'class="header-btn" ' +
            'title="ශබ්දකෝෂයේ සොයන්න">' +
            'ශබ්දකෝෂය' +
          '</button>' +

          '<button id="search-fts-btn" ' +
            'class="header-btn" ' +
            'title="සම්පූර්ණ පාඨ සෙවුම">' +
            'පාඨ සෙවුම' +
          '</button>' +

          '<div id="search-dropdown" ' +
            'class="search-dropdown">' +
          '</div>' +

          '<div class="search-filters small muted">' +

            '<label>' +
              '<input type="checkbox" ' +
                'id="sf-pali" checked> ' +
              'පාළි' +
            '</label>' +

            '<label>' +
              '<input type="checkbox" ' +
                'id="sf-sinh" checked> ' +
              'සිංහල' +
            '</label>' +

          '</div>' +

        '</div>' +

      '</div>'
  }


  function getFilterKeys() {
    return currentTreeFilter == 'all'
      ? []
      : [currentTreeFilter]
  }


  function searchColumns() {
    const cols = []

    const pali =
      document.getElementById('sf-pali')

    const sinh =
      document.getElementById('sf-sinh')

    if (pali && pali.checked) {
      cols.push(0)
    }

    if (sinh && sinh.checked) {
      cols.push(1)
    }

    return cols
  }


  function runTitleQuery(query) {
    const dropdown =
      document.getElementById('search-dropdown')

    if (!dropdown) return

    const q =
      search.cleanQuery(query)

    if (!q) {
      dropdown.classList.remove('show')
      return
    }

    const results =
      search.titleSearch(
        q,
        getFilterKeys(),
        searchColumns(),
        40
      )

    if (!results.length) {
      dropdown.innerHTML =
        '<div class="search-empty">' +
          'සොයන ග්‍රන්ථයක් හමුවූයේ නැත' +
        '</div>'

      dropdown.classList.add('show')

      return
    }

    let html = ''

    results.forEach(function (r) {
      const name =
        tree.getName(
          r.key,
          r.language,
          store.settings
        )

      const eInd =
        r.eInd
          ? r.eInd.join('-')
          : ''

      html +=
        '<div class="sd-item" ' +
          'data-result="' +
          utils.escapeHtml(
            r.key + '|' +
            r.language + '|' +
            eInd
          ) +
        '">' +

          '<span class="sd-name">' +
            utils.escapeHtml(name) +
          '</span>' +

          '<span class="sd-key">' +
            utils.escapeHtml(r.key) +
          '</span>' +

        '</div>'
    })

    dropdown.innerHTML = html
    dropdown.classList.add('show')
  }


  function openSearchResult(data) {
    const parts =
      data.split('|')

    if (!parts[0]) return

    const eInd =
      parts[2]
        ? parts[2].split('-').map(Number)
        : null

    reader.openTab({
      key: parts[0],
      language: parts[1] || null,
      eInd: eInd,
    })
  }


  function bindSearch() {
    const input =
      document.getElementById('search-input')

    const dropdown =
      document.getElementById('search-dropdown')

    if (!input || !dropdown) return

    /*
     * Title search debounce.
     */
    const debounced =
      utils.debounce(function () {
        runTitleQuery(input.value)
      }, 250)

    input.addEventListener(
      'input',
      debounced
    )


    /*
     * Enter = open first result.
     */
    input.addEventListener(
      'keydown',
      function (e) {
        if (e.key != 'Enter') return

        const first =
          dropdown.querySelector('.sd-item')

        if (first) {
          openSearchResult(
            first.dataset.result
          )

          dropdown.classList.remove('show')

          return
        }

        runTitleQuery(input.value)
      }
    )


    /*
     * Close dropdown when clicking outside.
     */
    document.addEventListener(
      'click',
      function (e) {
        if (!e.target.closest('#search-box')) {
          dropdown.classList.remove('show')
        }
      }
    )


    /*
     * Open selected title.
     */
    dropdown.addEventListener(
      'click',
      function (e) {
        const item =
          e.target.closest('.sd-item')

        if (!item) return

        openSearchResult(
          item.dataset.result
        )

        dropdown.classList.remove('show')

        input.value = ''
      }
    )


    /*
     * Dictionary search.
     */
    const dictBtn =
      document.getElementById(
        'search-dict-btn'
      )

    if (dictBtn) {
      dictBtn.addEventListener(
        'click',
        function () {
          const word =
            input.value.trim()

          location.href =
            './dictionary.html?word=' +
            encodeURIComponent(word)
        }
      )
    }


    /*
     * Full-text search.
     */
    const ftsBtn =
      document.getElementById(
        'search-fts-btn'
      )

    if (ftsBtn) {
      ftsBtn.addEventListener(
        'click',
        function () {
          runFts(input.value)
        }
      )
    }


    /*
     * Search language filters.
     */
    ;[
      'sf-pali',
      'sf-sinh'
    ].forEach(function (id) {
      const cb =
        document.getElementById(id)

      if (!cb) return

      cb.addEventListener(
        'change',
        function () {
          if (input.value) {
            runTitleQuery(
              input.value
            )
          }
        }
      )
    })
  }


  // -------------------------------------------------------------
  // full text search
  // -------------------------------------------------------------

  async function runFts(query) {
    const panel =
      document.getElementById('fts-panel')

    if (!panel) return

    const q =
      search.cleanQuery(query)

    if (!q) {
      utils.showSnackbar(
        'සෙවිය යුතු වචනයක් ඇතුළත් කරන්න'
      )

      return
    }

    panel.classList.add('show')

    const prog =
      document.getElementById(
        'fts-progress'
      )

    const list =
      document.getElementById(
        'fts-results'
      )

    if (!prog || !list) return

    prog.textContent =
      'පාඨ පරිලෝකනය වෙමින්…'

    list.innerHTML = ''

    const start = Date.now()

    const results =
      await search.fullTextSearch(
        q,
        [],
        [0, 1],
        function (done, total) {
          prog.textContent =
            'පාඨ පරිලෝකනය වෙමින්… (' +
            done +
            ' / ' +
            total +
            ')'
        }
      )

    prog.textContent =
      results.length
        ? 'ප්‍රතිඵල ' +
          results.length +
          ' ක් (' +
          Math.round(
            (Date.now() - start) / 1000
          ) +
          's)'
        : 'කිසිදු ප්‍රතිඵලයක් හමුවූයේ නැත'


    const groups =
      search.buildGroups(results)

    if (!groups.length) {
      list.innerHTML =
        '<div class="muted small">' +
          'මෙම වාක්‍යය සම්පූර්ණ පාඨවල ' +
          'හමුවූයේ නැත.' +
        '</div>'

      return
    }


    let html = ''

    groups.forEach(function (g) {
      const name =
        tree.getName(
          g.key,
          null,
          store.settings
        )

      html +=
        '<div class="fts-group">' +

          '<div class="fts-group-title">' +
            utils.escapeHtml(name) +
            ' (' +
            g.numMatches +
            ')' +
          '</div>'


      g.items.forEach(function (it) {
        const eInd =
          it.eInd
            ? it.eInd.join('-')
            : ''

        html +=
          '<div class="fts-item" ' +
            'data-result="' +
            utils.escapeHtml(
              g.key + '|' +
              it.language + '|' +
              eInd
            ) +
          '">' +

            '<div class="fts-text">' +
              utils.escapeHtml(
                it.hText
              ) +
            '</div>' +

            '<div class="fts-meta">' +
              it.language +
              ' · ' +
              it.numMatches +
            '</div>' +

          '</div>'
      })


      html +=
        '</div>'
    })


    list.innerHTML = html
  }


  function bindFtsPanel() {
    const panel =
      document.getElementById(
        'fts-panel'
      )

    if (!panel) return

    const closeBtn =
      panel.querySelector(
        '[data-fts-close]'
      )

    if (closeBtn) {
      closeBtn.addEventListener(
        'click',
        function () {
          panel.classList.remove('show')
        }
      )
    }


    const results =
      document.getElementById(
        'fts-results'
      )

    if (!results) return

    results.addEventListener(
      'click',
      function (e) {
        const item =
          e.target.closest('.fts-item')

        if (!item) return

        const parts =
          item.dataset.result.split('|')

        const eInd =
          parts[2]
            ? parts[2]
                .split('-')
                .map(Number)
            : null

        reader.openTab({
          key: parts[0],
          language: parts[1],
          eInd: eInd,
        })
      }
    )
  }


  // -------------------------------------------------------------
  // toolbar & settings dialog
  // -------------------------------------------------------------

  const COLUMN_LABELS = [
    'පාළි පමණි',
    'සිංහල පමණි',
    'පාළි + සිංහල',
    'පේළි අතර',
  ]


  function syncColumnsButton() {
    const btn =
      document.getElementById(
        'btn-columns'
      )

    const tab =
      reader.getActiveTab()

    if (btn) {
      btn.textContent =
        tab
          ? (
              COLUMN_LABELS[tab.columns] ||
              'තීරු'
            )
          : 'තීරු'
    }
  }


  function syncSeo() {
    const tab =
      reader.getActiveTab()

    if (
      tab &&
      tab.key &&
      Suththa.seo
    ) {
      Suththa.seo.update(
        tab.key,
        tab.language
      )
    }
  }


  /*
   * Shared reader actions. Bound to the desktop toolbar buttons (by id)
   * and to the mobile drawer buttons (by data-action).
   */
  const readerActions = {

    'prev-tab': function () {
      reader.setActiveInd(
        Math.max(
          0,
          reader.state.activeInd - 1
        )
      )
    },

    'next-tab': function () {
      reader.setActiveInd(
        Math.min(
          reader.state.tabList.length - 1,
          reader.state.activeInd + 1
        )
      )
    },

    'close-tab': function () {
      if (
        reader.state.activeInd >= 0
      ) {
        reader.closeTab(
          reader.state.activeInd
        )
      }

      syncColumnsButton()
    },

    'prev-text': function () {
      reader.navigateTabTo(-1)
    },

    'next-text': function () {
      reader.navigateTabTo(1)
    },

    'columns': function () {
      const tab =
        reader.getActiveTab()

      if (!tab) return

      const next =
        (tab.columns + 1) % 4

      if (tab.language) {
        tab.columns = next
        reader.updateHash()
        reader.renderAll()
      } else {
        store.set(
          'defaultColumns',
          next
        )
      }

      syncColumnsButton()
    },

    'settings': function () {
      if (openSettingsDialog) {
        openSettingsDialog()
      }
    },

    'theme': function () {
      store.set(
        'darkMode',
        !store.settings.darkMode
      )
    },
  }

  const toolbarIds = {
    'btn-prev-tab': 'prev-tab',
    'btn-next-tab': 'next-tab',
    'btn-close-tab': 'close-tab',
    'btn-prev-text': 'prev-text',
    'btn-next-text': 'next-text',
    'btn-columns': 'columns',
  }


  function bindToolbar() {
    /*
     * Desktop toolbar (by element id).
     */
    Object.keys(toolbarIds).forEach(
      function (id) {
        const el =
          document.getElementById(id)

        if (el) {
          el.addEventListener(
            'click',
            readerActions[
              toolbarIds[id]
            ]
          )
        }
      }
    )

    /*
     * Mobile drawer buttons (injectDrawerActions builds these).
     */
    const slot =
      document.getElementById(
        'drawer-actions'
      )

    if (slot) {
      slot.querySelectorAll(
        '[data-action]'
      ).forEach(function (btn) {
        const fn =
          readerActions[
            btn.dataset.action
          ]

        if (!fn) return

        btn.addEventListener(
          'click',
          function () {
            if (
              Suththa.nav.closeDrawer
            ) {
              Suththa.nav.closeDrawer()
            }

            fn()
          }
        )
      })
    }
  }


  /*
   * Mobile drawer — reader actions (toolbar equivalents).
   * Only filled on the reader page.
   */
  function injectDrawerActions() {
    const slot =
      document.getElementById(
        'drawer-actions'
      )

    if (!slot) return

    if (
      Suththa.nav.currentPage() !=
        'reader'
    ) {
      return
    }

    slot.innerHTML =
      '<div class="da-label">' +
        'කියවීමේ මෙවලම්' +
      '</div>' +

      '<div class="da-row">' +
        '<button class="drawer-action" ' +
          'data-action="prev-text" ' +
          'title="පෙර ග්‍රන්ථය">' +
          '⏮ පෙර' +
        '</button>' +
        '<button class="drawer-action" ' +
          'data-action="next-text" ' +
          'title="මීළඟ ග්‍රන්ථය">' +
          'මීළඟ ⏭' +
        '</button>' +
      '</div>' +

      '<div class="da-row">' +
        '<button class="drawer-action" ' +
          'data-action="prev-tab" ' +
          'title="පෙර ටැබ්">' +
          '◀ පෙර ටැබ්' +
        '</button>' +
        '<button class="drawer-action" ' +
          'data-action="next-tab" ' +
          'title="මීළඟ ටැබ්">' +
          'මීළඟ ටැබ් ▶' +
        '</button>' +
      '</div>' +

      '<div class="da-row">' +
        '<button class="drawer-action" ' +
          'data-action="columns">' +
          'තීරු පෙරළන්න' +
        '</button>' +
        '<button class="drawer-action" ' +
          'data-action="close-tab">' +
          'ටැබ් වසන්න' +
        '</button>' +
      '</div>' +

      '<div class="da-row">' +
        '<button class="drawer-action primary" ' +
          'data-action="settings">' +
          'සැකසුම්' +
        '</button>' +
        '<button class="drawer-action" ' +
          'data-action="theme">' +
          'තද පසුබිම' +
        '</button>' +
      '</div>'
  }


  let openSettingsDialog = null
  
function bindSettingsDialog() {
  const dialog =
    document.getElementById('settings-dialog')

  const openBtn =
    document.getElementById('btn-settings')

  const backdrop =
    document.getElementById('settings-backdrop')

  if (!dialog) {
    console.warn('Suththa: settings-dialog not found')
    return
  }

  function open() {
    dialog.classList.add('open')

    if (backdrop) {
      backdrop.classList.add('open')
    }

    syncSettingsForm()
  }

  function close() {
    dialog.classList.remove('open')

    if (backdrop) {
      backdrop.classList.remove('open')
    }
  }

  openSettingsDialog = open

  /* ---------------------------------------------------------
     Open settings
     --------------------------------------------------------- */

  if (openBtn) {
    openBtn.addEventListener('click', function (e) {
      e.preventDefault()
      e.stopPropagation()
      open()
    })
  }

  /* ---------------------------------------------------------
     Close button
     Uses delegated handling so it remains reliable.
     --------------------------------------------------------- */

  dialog.addEventListener('click', function (e) {
    const closeTarget =
      e.target.closest('[data-dialog-close]')

    if (!closeTarget) return

    e.preventDefault()
    e.stopPropagation()

    close()
  })

  /* ---------------------------------------------------------
     Click outside dialog
     --------------------------------------------------------- */

  if (backdrop) {
    backdrop.addEventListener('click', function (e) {
      if (e.target !== backdrop) return

      close()
    })
  }

  /* ---------------------------------------------------------
     ESC key
     --------------------------------------------------------- */

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return

    if (!dialog.classList.contains('open')) return

    close()
  })

  /* ---------------------------------------------------------
     Settings setters
     --------------------------------------------------------- */

  const setters = {

    'set-darkmode': function (v) {
      store.set(
        'darkMode',
        Boolean(v)
      )
    },

    'set-columns': function (v) {
      const cols = Number(v)

      store.set(
        'defaultColumns',
        cols
      )

      /*
       * Language-pinned tabs keep their own per-tab columns,
       * so also apply the dialog choice to the active tab.
       */
      const tab =
        reader.getActiveTab()

      if (
        tab &&
        tab.language
      ) {
        tab.columns = cols
        reader.renderAll()
      }
    },

    'set-tree-lang': function (v) {
      store.set(
        'treeLanguage',
        v
      )

      /*
       * Rebuild tree immediately so the selected
       * language is visible without reopening the page.
       */
      if (
        Suththa.tree &&
        typeof Suththa.tree.recomputeTree === 'function'
      ) {
        Suththa.tree.recomputeTree(store.settings)
        renderTree()
      }
    },

    'set-footnote-method': function (v) {
      store.set(
        'footnoteMethod',
        v
      )
    },

    'set-bandi': function (v) {
      store.set(
        'bandiLetters',
        Boolean(v)
      )
    },

    'set-special': function (v) {
      store.set(
        'specialLetters',
        Boolean(v)
      )
    },

    'set-page-nums': function (v) {
      store.set(
        'showPageNumbers',
        Boolean(v)
      )
    },

    'set-font-size': function (v) {
      store.set(
        'fontSize',
        Number(v)
      )
    }
  }

  /* ---------------------------------------------------------
     Bind every settings control
     --------------------------------------------------------- */

  Object.keys(setters).forEach(function (name) {

    const el =
      dialog.querySelector(
        '[data-setting="' + name + '"]'
      )

    if (!el) {
      console.warn(
        'Suththa: settings control not found:',
        name
      )
      return
    }

    el.addEventListener('change', function () {

      const value =
        el.type === 'checkbox'
          ? el.checked
          : el.value

      setters[name](value)
    })
  })
}




  function syncSettingsForm() {
    const dialog =
      document.getElementById(
        'settings-dialog'
      )

    if (!dialog) return

    const s =
      store.settings

    const map = {

      'set-darkmode':
        s.darkMode,

      'set-columns':
        String(
          s.defaultColumns
        ),

      'set-tree-lang':
        s.treeLanguage,

      'set-footnote-method':
        s.footnoteMethod,

      'set-bandi':
        s.bandiLetters,

      'set-special':
        s.specialLetters,

      'set-page-nums':
        s.showPageNumbers,

      'set-font-size':
        String(
          s.fontSize
        ),
    }


    Object.keys(map).forEach(
      function (name) {
        const el =
          dialog.querySelector(
            '[data-setting="' +
            name +
            '"]'
          )

        if (!el) return

        if (el.type == 'checkbox') {
          el.checked = map[name]
        } else {
          el.value = map[name]
        }
      }
    )
  }


  // -------------------------------------------------------------
  // sidebar toggle
  // -------------------------------------------------------------

  function bindSidebar() {
    const toggle =
      document.getElementById(
        'sidebar-toggle'
      )

    const sidebar =
      document.getElementById(
        'sidebar'
      )

    const backdrop =
      document.getElementById(
        'sidebar-backdrop'
      )

    if (!toggle || !sidebar) return


    function close() {
      sidebar.classList.remove(
        'open'
      )

      document.body.classList.remove(
        'suth-sidebar-open'
      )

      if (backdrop) {
        backdrop.classList.remove(
          'show'
        )
      }
    }


    toggle.addEventListener(
      'click',
      function () {
        // Close the mobile drawer so both panels are not open at once
        if (Suththa.nav.closeDrawer) {
          Suththa.nav.closeDrawer()
        }

        const open =
          sidebar.classList.toggle(
            'open'
          )

        document.body.classList.toggle(
          'suth-sidebar-open',
          open
        )

        if (backdrop) {
          backdrop.classList.toggle(
            'show',
            open
          )
        }
      }
    )


    if (backdrop) {
      backdrop.addEventListener(
        'click',
        close
      )
    }
  }


  // -------------------------------------------------------------
  // font size
  // -------------------------------------------------------------

  function applyFontSize() {
    const el =
      document.getElementById(
        'tabs-content'
      )

    if (el) {
      el.style.fontSize =
        store.fontPx()
    }
  }


  // -------------------------------------------------------------
  // path-based deep links
  // -------------------------------------------------------------

  function parsePathRoute() {
    const parts =
      location.pathname
        .split('/')
        .filter(Boolean)

    if (!parts.length) {
      return null
    }

    const key = parts[0]

    if (
      key.indexOf('.html') >= 0 ||
      key == 'static'
    ) {
      return null
    }

    const item =
      tree.getKey(key)

    if (!item) {
      return null
    }

    let language =
      parts[1]

    if (
      language != 'pali' &&
      language != 'sinh'
    ) {
      language = null
    }

    return {
      key: key,
      language: language,
      eInd: item.eInd,
    }
  }


  // -------------------------------------------------------------
  // boot
  // -------------------------------------------------------------

  function init() {
    store.loadSettings()

    /*
     * Navigation creates:
     * #header-search-slot
     *
     * before the search UI is injected.
     */
    Suththa.nav.init()

    /*
     * Search UI is outside the navbar.
     */
    injectSearchBox()

    /*
     * Mobile drawer — reader actions live inside #drawer-actions.
     */
    injectDrawerActions()

    store.on(
      'settings-change',
      applyFontSize
    )

    applyFontSize()


    const boot =
      document.getElementById('boot')

    if (boot) {
      boot.style.display = 'none'
    }


    /*
     * Footnote abbreviations.
     */
    utils.getJson(
      config.abbreviationsUrl
    )
      .then(function (a) {
        Suththa.store.footnoteAbbreviations =
          a || {}
      })
      .catch(function () {
        Suththa.store.footnoteAbbreviations =
          {}
      })


    /*
     * Tree initialization.
     */
    tree.initialize()
      .then(function () {

        reader.init()

        bindSidebar()

        /*
         * Lazy tree:
         * only root nodes are rendered now.
         */
        renderTree()

        bindTree()

        bindTreeFilters()

        bindSearch()

        bindFtsPanel()

        bindToolbar()

        bindSettingsDialog()

        store.on(
          'settings-change',
          syncColumnsButton
        )

        applyFontSize()


        /*
         * Re-render only when branches actually sync.
         */
        store.on(
          'sync-branches',
          function () {
            renderTree()
            syncColumnsButton()
            syncSeo()
          }
        )


        /*
         * Open tab from hash or path.
         */
        if (location.hash) {

          reader.handleHash()

        } else {

          const route =
            parsePathRoute()

          if (route) {

            reader.openTab(route)

          } else {

            reader.renderAll()

          }
        }
      })

      .catch(function (e) {

        if (boot) {
          boot.innerHTML =
            '<div class="banner error">' +
              'දත්ත පූරණය කළ නොහැක: ' +
              utils.escapeHtml(
                e.message
              ) +
            '</div>'

          boot.style.display = ''
        }
      })
  }


  Suththa.app = {
    init: init,
  }

  document.addEventListener(
    'DOMContentLoaded',
    init
  )

})()
