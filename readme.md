# TaskMgr (WIP)

A simple daily task manager extension builded with Vue and Vuex, working in progress.

## todo

- merge SVGs to main.css by using `data:image/svg+xml` scheme to reduce request?
- Use Vue `render` function instead of `eval` template compiling to avoid webextension CSP restriction
- drag to sort task item.(splice then insert?)

summary:

- add a searchbox to find specific task
- add a summary editor (`contentEditable` div)?
  - normal edit: simple text
  - paste: any html content (will save via raw html)

timer:

- timer history

setting:

- custom CSS code
- default timer interval
- a recycle bin to recover deleted task?(last for 15 days)
