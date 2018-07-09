const factory       = require('jf-factory').i();
const jfServerBase  = require('../Base');
const jfHttpHeaders = require('jf-http-headers');

/**
 * Clase base para los punto de entrada de las peticiones.
 *
 * @namespace jf.server.method
 * @class     jf.server.method.Base
 * @extends   jf.server.Base
 */
class jfServerMethodBase extends jfServerBase
{
    /**
     * @override
     */
    constructor(config)
    {
        super();
        this.body       = null;
        this.headers    = new jfHttpHeaders();
        this.request    = null;
        this.root       = '';
        this.statusCode = null;
        this.title      = '';
        this.tpl        = 'html';
        this.type       = 'text/html; charset=utf-8';
        if (config)
        {
            Object.assign(this, config);
        }
    }

    process()
    {
        throw new Error(`El método ${this.constructor.name}::process debe ser implementado`);
    }
}

factory.register('Base', jfServerMethodBase);
module.exports = jfServerMethodBase;
