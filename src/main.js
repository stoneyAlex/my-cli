/*
 * @Author: shimingxia
 * @Date: 2022-06-29 10:09:50
 * @LastEditors: shimingxia
 * @LastEditTime: 2022-06-29 10:37:11
 * @Description: 
 */

const {
  version
} = require('./constant')
const path = require('path')
const program = require('commander')

// 配置交互指令
const ActionsMap = {
  create: {
    alias: 'c',
    description: 'Create a new project',
    example: ['my-cli create <project-name>']
  },
  config: {
    alias: 'conf',
    description: 'config project variable',
    example: ['my-cli config set <k><v>', 'my-cli config get <k>']
  },
  '*': {
    alias: '',
    description: 'command not found',
    example: []
  }
}

Reflect.ownKeys(ActionsMap).forEach(action => {
  program
    .command(action) // 配置的命令名称
    .alias(ActionsMap[action].alias) // 命令的别名
    .description(ActionsMap[action].description) // 命令对应的描述
    .action(() => {
      if(action === '*') { // 找不到相应的命令
        console.log(ActionsMap[action].description)
      } else {
        console.log(action)
        // 截取命令
        // my-cli create program
        require(path.resolve(__dirname, action))(...process.argv.slice(3))
      }
    })
})

// 监听输入的help事件
program.on("--help", () => {
  console.log("Example: ")
  Reflect.ownKeys(ActionsMap).forEach(action => {
    ActionsMap[action].example.forEach(example => {
      console.log(example)
    })
  })
})

program.version(version).parse(process.argv)