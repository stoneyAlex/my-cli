/*
 * @Author: shimingxia
 * @Date: 2022-06-29 10:15:04
 * @LastEditors: shimingxia
 * @LastEditTime: 2022-06-29 13:57:01
 * @Description: 
 */
const { version } = require('../package.json')
const downloadDirectory = `${process.env[process.platform === 'darwin' ? 'HOME' : 'USERPROFILE']}/.template`
module.exports = {
  version,
  downloadDirectory
}