/*
 * @Author: shimingxia
 * @Date: 2022-06-29 10:39:38
 * @LastEditors: shimingxia
 * @LastEditTime: 2022-06-29 17:06:58
 * @Description: 
 */
const axios = require('axios')
const ora = require('ora')
const Inquirer = require('inquirer')
const path = require('path')
const { downloadDirectory } = require('./constant')
const {promisify} = require('util')
let downloadGitRepo = require('download-git-repo')
downloadGitRepo = promisify(downloadGitRepo)
let ncp = require('ncp')
ncp = promisify(ncp)
const fs = require('fs')
const MetalSmith = require('metalsmith')
let { render } = require('consolidate').ejs
render = promisify(render)

// 获取仓库模板信息
const fetchRepoList = async () => {
  const { data } = await axios.get("https://api.github.com/td-cli/repos")
  return data;
}

// 封装loading
const waitFnloading = (fn, message) => async (...args) => {
  const spinner = ora(message)
  spinner.start()
  let repos = await fn(...args)
  spinner.succeed()
  return repos
}

// 获取tag列表
const fetchTagList = async (repo) => {
  const { data } = await axios.get(`https://api.github.com/repos/td-cli/${repo}/tags`)
  return data
}

// 下载项目
const download = async (repo, tag) => {
  let api = `td-cli/${repo}`
  if(tag) {
    api += `#${tag}`
  }
  const dest = `${downloadDirectory}/${repo}}`
  await downloadGitRepo(api, dest)
  return dest
}

module.exports = async (proname) => {
  // 1，获取项目模板
  let repos = await waitFnloading(fetchRepoList, 'fetching template...')()
  repos = repos.map(item => item.name)
  console.log(repos)
  const {repo} = await Inquirer.prompt({
    name: 'repo',
    type: 'list',
    message: 'please choise a template to create a project',
    choices: repos
  })
  console.log(repo)
  // 2, 获得对应的版本号
  let tags = await waitFnloading(fetchTagList, 'fetching tags...')(repo)
  tags = tags.map(item => item.name)
  // 选择版本号
  const {
    tag
  } = await Inquirer.prompt({
    name: 'tag',
    type: 'list',
    message: 'please choose tags to create project',
    choices: tags,
  })
  console.log(repo, tag)
  // 3, 下载项目后 返回一个临时存放的目录
  const result = await waitFnloading(download, 'download template...')(repo, tag)
  if (!fs.existsSync(path.join(result, 'ask.js'))) {
    await ncp(result, path.resolve(proname))
  } else {
    // 复杂的模板
    // 需要用户选择 选择后编译模板
    await new Promise((resolve, reject) => {
      MetalSmith(__dirname)
        .source(result)
        .destination(path.resolve(proname))
        .use(async (files, metal, done) => {
          // files 现在就是所有的文件
          // 拿到提前配置好的信息 传下去 渲染
          const args = require(path.join(result, 'ask.js'))
          // 拿到了让用户填写 返回填写的信息
          const obj = await Inquirer.prompt(args)
          const meta = metal.metadata() // 获取的信息合并传入下一个use
          Object.assign(meta, obj)
          delete files['ask.js']
          done()
        })
        .use((files, metal, done) => {
          // 更新用户信息渲染模板
          const obj = metal.metadata()
          Reflect.ownKeys(files).forEach(async (file) => {
            if(file.includes("js") || files.includes('json')) {
              // 文件内容
              let content = files[file].contents.toStrinf()
              // 判断是不是模板
              if(content.includes("<%")) {
                content = await render(content, obj)
                files[file].contents = Buffer.from(content) // 渲染
              }
            }
          })
          done()
        })
        .build(err => {
          if(err) {
            reject()
          } else {
            resolve()
          }
        })
    })
  }
}