const jfServer     = require('../src/Server');
const jfServerBase = require('../src/Base');
const start        = new jfServer({ port : process.argv[2] || 8888 });
jfServerBase.ROOT  = process.argv[3] || 'www';
start.updateMimeTypes(['.css', '.html', '.md'], 'charset', 'UTF-8');
start.start();
//
require('../src/handler/Get');
module.exports = start;
