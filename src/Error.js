const jfServerBase = require('./Base');
const STATUS_CODES = require('http').STATUS_CODES;
/**
 * Clase a usar para lanzar las excepciones.
 *
 * @namespace jf.server
 * @class     jf.server.Error
 */
module.exports = class jfServerError extends jfServerBase
{
    /**
     * Constructor de la clase.
     *
     * @param {object} config Configuración a aplicar a la instancia.
     */
    constructor(config = {})
    {
        super();
        /**
         * Código que identifica al error.
         *
         * @property code
         * @type     {string|number}
         */
        this.code = '';
        /**
         * Mensaje del error.
         *
         * @property message
         * @type     {string}
         */
        this.message = '';
        /**
         * Código HTTP a devolver.
         *
         * @type {number}
         */
        this.statusCode = 500;
        //------------------------------------------------------------------------------
        this.setProperties(config);
        const _statusCode = this.statusCode;
        if (_statusCode && !this.message && _statusCode in STATUS_CODES)
        {
            this.message = STATUS_CODES[_statusCode];
        }
    }
};
