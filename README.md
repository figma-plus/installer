# figments-injector (prealpha POC)
A helper tool that injects Figments (Figma Plugins) into Figma's desktop apps.

## Requirments
* node
* yarn
* `asar` (npm package) globally installed
* Figma macOS (desktop app)

## How to use
1. clone the repo & cd into it.
1. run `yarn`
1. run `yarn global add asar` (or `npm i -g asar`)
1. run `node index.js`
1. That's it!  Run Figma's desktop app and you'll see a a message in devtools console confriming that it worked.

## Todo
- [ ] Inject Figments instead of dumb code.
- [x] Add support for Windows.
- [ ] Create a GUI app.
- [ ] Ship it!
