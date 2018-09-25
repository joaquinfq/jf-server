const jfServerBase              = require('../Base');
const jfServerAdapterBase       = require('../adapter/Base');
const jfServerResponseHtml      = require('../response/Html');
const jfServerStorageFileSystem = require('../storage/FileSystem');
const path                      = require('path');
const urlParse                  = require('url').parse;
/**
 * Clase base para los punto de entrada de las peticiones.
 *
 * @namespace jf.server.handler
 * @class     jf.server.handler.Base
 * @extends   jf.server.Base
 */
module.exports = class jfServerHandlerBase extends jfServerBase
{
    /**
     * Extensiones que gestiona la clase.
     *
     * @return {string[]} Listado de extensiones.
     */
    static get extensions()
    {
        return [];
    }

    /**
     * @override
     */
    constructor(config)
    {
        super();
        /**
         * Adaptador de la especificación de la API.
         *
         * @property adapter
         * @type     {jf.server.adapter.Base|null}
         */
        this.adapter = null;
        /**
         * Cuerpo de la petición.
         *
         * @property body
         * @type     {object|string|null}
         */
        this.body = null;
        /**
         * Manejador de la respuesta a enviar al cliente.
         *
         * @property response
         * @type     {jf.server.response.Base|null}
         */
        this.response = null;
        /**
         * Manejador de la petición.
         *
         * @property request
         * @type     {http.IncomingMessage|null}
         */
        this.request = null;
        /**
         * Manejador del almacenamiento a usar para escribir/leer los recursos.
         *
         * @property storage
         * @type     {jf.server.storage.Base|null}
         */
        this.storage = null;
        /**
         * Información de la URL de la petición.
         *
         * @property url
         * @type     {Url|null}
         */
        this.url = null;
        //------------------------------------------------------------------------------
        this.setProperties(config);
        this._init(config);
        // Convertimos a objeto el cuerpo de la petición.
        const _body = this.body;
        if (typeof _body === 'string' && (_body[0] === '{' || _body[0] === '['))
        {
            try
            {
                this.body = JSON.parse(_body);
            }
            catch (e)
            {
            }
        }
        this._parseUrl(this.request.url);
        this.adapter.request(this.url, this.request, _body);
    }

    /**
     * Devuelve el nombre del archivo al que corresponde la ruta de la petición.
     */
    getFilename()
    {
        return path.join(this.constructor.ROOT, ...this.url.pathname.split('/'));
    }

    /**
     * Método usado para inicializar las instancias de clases requeridas por el manejador.
     * Sobrescribiendo este método cada clase hija colocará los valores apropiados.
     *
     * @protected
     */
    _init(config)
    {
        this.adapter  = new jfServerAdapterBase(config);
        this.response = new jfServerResponseHtml(config);
        this.storage  = new jfServerStorageFileSystem(config);
    }

    /**
     * Analiza la URL y asigna las propiedades de la clase que correspondan.
     * Si la URL es inválida, asigna un error.
     *
     * @protected
     */
    _parseUrl()
    {
        const _url = this.request && this.request.url;
        if (_url)
        {
            const _parsed   = urlParse(_url);
            const _pathname = _parsed.pathname;
            if (this._validatePathname(_pathname))
            {
                this.url = _parsed;
            }
            else
            {
                this.response.setError(
                    {
                        message    : 'Ruta inválida: ' + _pathname,
                        statusCode : 400
                    }
                );
            }
        }
    }

    /**
     * Punto de entrada para el manejo de la petición.
     * Las clases hijas deberían sobrescribir este método.
     */
    async process()
    {
        this.adapter.response(this.response);
    }

    /**
     * Verifica que la ruta especificada sea válida.
     *
     * @param {string} pathname Ruta a validar.
     *
     * @return {boolean} `true` si la ruta es válida.
     *
     * @protected
     */
    _validatePathname(pathname)
    {
        //------------------------------------------------------------------------------
        // Evitamos que cualquier parte empiece por un punto para evitar ataques del
        // tipo `/api/../../../` o acceder a archivos ocultos como `.htaccess`.
        //------------------------------------------------------------------------------
        return pathname.length > 0 && (pathname === '/' || pathname.split('/').slice(1).every(s => s && s[0] !== '.'));
    }
};
