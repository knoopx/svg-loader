const path = require("path")

const { parseSvg } = require('svgo/lib/parser');
const { parseQuery, getOptions, interpolateName } = require("loader-utils")

const getOutputAndPublicPath = (
  fileName,
  { outputPath: configOutputPath, publicPath: configPublicPath },
) => {
  let outputPath = fileName
  if (configOutputPath) {
    if (typeof configOutputPath === "function") {
      outputPath = configOutputPath(fileName)
    } else {
      outputPath = path.posix.join(configOutputPath, fileName)
    }
  }
  let publicPath = `__webpack_public_path__ + ${JSON.stringify(outputPath)}`

  if (configPublicPath) {
    if (typeof configPublicPath === "function") {
      publicPath = configPublicPath(fileName)
    } else if (configPublicPath.endsWith("/")) {
      publicPath = configPublicPath + fileName
    } else {
      publicPath = `${configPublicPath}/${fileName}`
    }

    publicPath = JSON.stringify(publicPath)
  }

  return {
    outputPath,
    publicPath,
  }
}

module.exports = function (content) {
  const parsedResourceQuery = this.resourceQuery
    ? parseQuery(this.resourceQuery)
    : {}

  const options = {
    name: "[hash].[ext]",
    emitFile: true,
    ...getOptions(this),
    ...parsedResourceQuery,
  }

  const outputContext = options.context || this.rootContext

  const ast = parseSvg(content)

  if (ast.error) {
    throw new Error(ast.error)
  }

  const svg = ast.querySelector("svg")
  const width = Number(svg.attr("width").value)
  const height = Number(svg.attr("height").value)

  const fileName = interpolateName(this, options.name, {
    context: outputContext,
    content,
  })

  const { outputPath, publicPath } = getOutputAndPublicPath(fileName, {
    outputPath: options.outputPath,
    publicPath: options.publicPath,
  })

  if (options.emitFile) {
    this.emitFile(outputPath, content, null)
  }

  return `module.exports = {
    src: ${publicPath},
    width: ${width},
    height: ${height},
  }`
}

module.exports.raw = true
