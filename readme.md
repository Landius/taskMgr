# TaskMgr (WIP)

A simple daily task manager extension builded with Vue and Vuex, working in progress.

## todo

- merge SVGs to main.css by using `data:image/svg+xml` scheme to reduce request?
- Use Vue `render` function instead of `eval` template compiling to avoid webextension CSP restriction
- storage data load on demand
- drag to sort task item.(splice then insert?)

new tab:  

- focus on searchbox when switch to newtab page.

summary:

- left panel to show summarized tasks, right panel show finished but not summarized tasks?
- add a filter to filter tasks by quadrant
- add a searchbox to find specific task
- add recover btn to make a task back to task section
- add a summary editor (`contentEditable` div)
  - normal edit: simple text
  - paste: any html content (will save via raw html)

timer:

- add panel to select related task when editing timer
- timer history

setting:

- custom CSS code
- default timer target
- a recycle bin to recover deleted task?(will be delete after 15 days)
