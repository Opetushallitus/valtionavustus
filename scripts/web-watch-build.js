#!/usr/bin/env node

"use strict";

const path = require("path")
const spawn = require("child_process").spawn
const pathDispatchDebounceInMS = 500

const errorExit = (exitCode, ...msgs) => {
  console.error(...msgs)
  process.exit(exitCode)
}

const getProjectDir = () => path.resolve(path.dirname(__filename), "..")

const getScriptName = () => path.basename(__filename)

const padLeft = (padChar, padSize, value) => {
  let formatted = "" + value
  const padNeeded = Math.max(0, padSize - formatted.length)

  for (let index = 0; index < padNeeded; index += 1) {
    formatted = padChar + formatted
  }

  return formatted
}

const formatDateTime = date => {
  const yyyy = padLeft("0", 4, date.getFullYear())
  const mm = padLeft("0", 2, date.getMonth() + 1)
  const dd = padLeft("0", 2, date.getDate())
  const HH = padLeft("0", 2, date.getHours())
  const MM = padLeft("0", 2, date.getMinutes())
  const SS = padLeft("0", 2, date.getSeconds())
  return `${yyyy}-${mm}-${dd} ${HH}:${MM}:${SS}`
}

const tsLog = (...args) => {
  console.log(formatDateTime(new Date()) + " ", ...args)
}

const usageHelp = () => {
  return `Usage: ${getScriptName()} [-h]

Watch JavaScript sources of the main projects (va-virkailija and
va-hakija) and their dependencies (soresu-form and va-common), and build
the main projects upon change.

    -h, --help      display this help and exit`
}

const tryRequire = pkg => {
  try {
    return require(pkg)
  } catch (err) {
    errorExit(1, `error loading module "${pkg}", have you run \`npm install\`?`, err)
  }
}

const queue1 = runFun => {
  let isRunning = false
  let isQueued = false

  const callback = () => {
    isRunning = false
    if (isQueued) {
      isQueued = false
      setImmediate(() => { queuedRunFun() })
      return true
    } else {
      return false
    }
  }

  const queuedRunFun = () => {
    if (isRunning) {
      isQueued = true
    } else {
      isRunning = true
      runFun(callback)
    }
  }

  return queuedRunFun
}

const Chalk = tryRequire("chalk")
const Bacon = tryRequire("baconjs")

const makeQueuedSpawn = (cmd, args, cwd) => {
  const startCommandB = new Bacon.Bus()
  const isCommandRunningB = new Bacon.Bus()
  const completeCommandB = new Bacon.Bus()

  const queuedSpawn = queue1(callback => {
    isCommandRunningB.push(true)

    const cmdStr = cmd + " " + args.join(" ")

    tsLog(`Start in ${Chalk.yellow(cwd)}: ${Chalk.bold.white(cmdStr)}`)

    const child = spawn(cmd, args, {cwd: cwd})

    child.stderr.on("data", data => {
      // writes to stderr might get interleaved between child processes
      console.error(Chalk.red(data.toString()))
    })

    child.on("close", exitCode => {
      const exitCodeMsg = exitCode === 0 ? Chalk.bold.white(exitCode) : Chalk.bold.red(exitCode)
      const cmdStrMsg = Chalk.bold[exitCode === 0 ? "white" : "red"](cmdStr)
      tsLog(`Complete (${exitCodeMsg}) in ${Chalk.yellow(cwd)}: ${cmdStrMsg}`)
      const startingQueuedCommand = callback()
      completeCommandB.push({exitCode})
      isCommandRunningB.push(startingQueuedCommand)
    })
  })

  startCommandB.onValue(() => { queuedSpawn() })

  return {
    startCommandB,
    isCommandRunningP: isCommandRunningB.toProperty(false).skipDuplicates(),
    completeCommandE: completeCommandB.toEventStream()
  }
}

const makeBuildDispatcher = () => {
  const dispatchB = new Bacon.Bus()
  const pathDispatchE = dispatchB.map(p => p.split("/")[0])

  const pkgInstallers = ["soresu-form", "va-common"].reduce((acc0, pkg) => {
    return ["va-hakija", "va-virkailija"].reduce((acc1, webapp) => {
      const queuedSpawn = makeQueuedSpawn("npm", ["install", "-q", pkg], webapp)
      acc1[webapp + "/" + pkg] = queuedSpawn
      return acc1
    }, acc0)
  }, {})

  ;["soresu-form", "va-common"].forEach(pkg => {
    const pkgPathDispatchE = pathDispatchE
      .filter(p => p === pkg)
      .debounce(pathDispatchDebounceInMS)

    ;["va-hakija", "va-virkailija"].forEach(webapp => {
      pkgInstallers[webapp + "/" + pkg].startCommandB.plug(pkgPathDispatchE)
    })
  })

  const webappBuilders = ["va-hakija", "va-virkailija"].reduce((acc0, webapp) => {
    const build = makeQueuedSpawn("npm", ["run", "dev-build"], webapp)
    acc0[webapp] = build
    return acc0
  }, {})

  ;["va-hakija", "va-virkailija"].forEach(webapp => {
    const successfulPkgInstallsE = Bacon.mergeAll(["soresu-form", "va-common"].map(pkg =>
      pkgInstallers[webapp + "/" + pkg].completeCommandE.filter(res => res.exitCode === 0)
    ))

    const anyPkgIsInstallingP = pkgInstallers[webapp + "/soresu-form"].isCommandRunningP
      .combine(pkgInstallers[webapp + "/va-common"].isCommandRunningP, (a, b) => a || b)
      .skipDuplicates()

    const webappPathDispatchE = pathDispatchE
      .filter(p => p === webapp)
      .debounce(pathDispatchDebounceInMS)

    const startBuildE = successfulPkgInstallsE.merge(webappPathDispatchE)
      .combine(anyPkgIsInstallingP, (_, isInstalling) => isInstalling)
      .filter(isInstalling => !isInstalling)

    webappBuilders[webapp].startCommandB.plug(startBuildE)
  })

  return (event, path) => {
    if (event) {
      tsLog(Chalk.gray("(" + event + ")"), Chalk.cyan(path))
    }

    dispatchB.push(path)
  }
}

try {
  process.chdir(getProjectDir())
} catch (e) {
  errorExit(1, "cannot chdir to project directory")
}

if (process.argv.slice(2).some(arg => /^(?:-h|-\?|--help)$/.test(arg))) {
  console.log(usageHelp())
  process.exit()
}

const Chokidar = tryRequire("chokidar")

const dispatchBuild = makeBuildDispatcher()

tsLog(Chalk.gray("Making first build…"))

dispatchBuild(null, "soresu-form/")
dispatchBuild(null, "va-common/")

setTimeout(() => {
  const watcher = Chokidar.watch([
    "soresu-form/web",
    "va-common/web",
    "va-hakija/web",
    "va-virkailija/web"
  ], {
    ignored: ["**/.*", "**/web/test"]
  }).on("ready", () => {
    watcher.on("add", dispatchBuild.bind(null, "add"))
    watcher.on("change", dispatchBuild.bind(null, "change"))
    watcher.on("unlink", dispatchBuild.bind(null, "unlink"))

    tsLog(Chalk.gray("Started watching for changes in files…"))
  })
}, pathDispatchDebounceInMS)
