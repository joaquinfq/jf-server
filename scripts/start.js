const jfServer           = require('../src/Server');
const jfServerBase       = require('../src/Base');
const jfServerHandlerGet = require('../src/handler/Get');
const start              = new jfServer({ port : process.argv[2] || 8888 });
jfServerBase.ROOT        = process.argv[3] || 'www';
start.register('GET', jfServerHandlerGet);
start.updateMimeTypes(['.css', '.html', '.md'], 'charset', 'UTF-8');
start.start();
//
module.exports = start;
