const vscode = require('vscode');
const registerCommand = vscode.commands.registerCommand

/**
 * @param {vscode.ExtensionContext} context
 */
function activate({ subscriptions }) {
  console.log('Congratulations, your extension "django-manager" is now active!');

  subscriptions.push(registerCommand('django-manager.makeMigrations', async () => {
    if (!(await djangoExists())) return

    const terminal = await getTerminal()
    terminal.sendText('python manage.py makemigrations')
  }))

  subscriptions.push(registerCommand('django-manager.migrate', async () => {
    if (!(await djangoExists())) return

    const terminal = await getTerminal()
    terminal.sendText('python manage.py migrate')
  }))

  subscriptions.push(registerCommand('django-manager.runServer', async () => {
    if (!(await djangoExists())) return

    const terminal = await getTerminal()
    terminal.sendText('python manage.py runserver')
  }))


  subscriptions.push(registerCommand('django-manager.migrateAndRun', async () => {
    if (!(await djangoExists())) return

    const terminal = await getTerminal()
    terminal.sendText('python manage.py migrate')
    terminal.sendText('python manage.py runserver')
  }))

  subscriptions.push(registerCommand('django-manager.loadData', async () => {
    if (!(await djangoExists())) return

    const terminal = await getTerminal()

    const fixtures = await vscode.workspace.findFiles('fixtures/**')

    /**
     * Turns absolute path into relative fixture path
     * @example
     * /home/user/dev/django-site/fixtures/users.json => fixtures/users.json
     * @param {String} fullPath
     */
    const getShortPath = (fullPath) => {
      const splitPath = fullPath.split('/')
      return splitPath.slice(splitPath.indexOf('fixtures')).join('/')
    }
    /**
     * Turns absolute path into a nice label
     * @example
     * /home/user/dev/django-site/fixtures/userObjects.json => User Objects
     * fixtures/lots_of_cool_items.json => Lots Of Cool Items
     * @param {String} fullPath
     */
    const makeLabelFromPath = (fullPath) => {
      let label = ''
      const fileName = fullPath.split('/').slice(-1)[0].split('.')[0]

      // hello => Hello
      const capitalize = (word) => {
        return word[0].toUpperCase() + word.slice(1).toLowerCase()
      }

      // split_by_underscore => Split By Underscore
      if (fileName.indexOf('_') !== -1) {
        label = fileName.split('_').map(capitalize).join(' ')
      }

      // camelCaseName => Camel Case Name
      if (!label) {
        label = fileName.split(/([A-Z][a-z]+)/).filter(e => e).map(capitalize).join(' ')
      }

      return label
    }

    const items = [
      {
        label: 'Run all',
        path: 'fixtures/*'
      },
      ...fixtures.map(fixture => {
        return {
          label: makeLabelFromPath(fixture.path),
          path: getShortPath(fixture.path)
        }
      })
    ]
    const item = await vscode.window.showQuickPick(items)

    if (!item) return

    terminal.sendText(`python manage.py loaddata ${item.path}`)
  }))
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

/**
 * Open a picker to choose a terminal to run commands in
 */
async function selectTerminal () {
  const terminals = vscode.window.terminals
  const items = terminals.map(terminal => {
    return {
      label: `name: ${terminal.name}`,
      terminal,
    }
  })

  if (items.length === 1) {
    return items[0].terminal
  }

  const item = await vscode.window.showQuickPick(items)
  return item ? item.terminal : undefined
}

function terminalExists() {
  if (vscode.window.terminals.length === 0) {
    vscode.window.createTerminal('Django Manager')
  }
  return true
}

async function getTerminal() {
  if (terminalExists()) {
    const terminal = await selectTerminal()
    terminal.show()
    return terminal
  }
}

async function djangoExists() {
  const files = await vscode.workspace.findFiles('**/manage.py')
  if (!files.length) {
    vscode.window.showErrorMessage('No manage.py found in workspace')
    return false
  }
  return true
}

module.exports = {
  activate,
  deactivate
}
