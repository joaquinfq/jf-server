const jfServerBase = require('../Base');
const path         = require('path');
const urlParse     = require('url').parse;
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
         * Indica si habilita las cabeceras para evitar CORS.
         *
         * @type {boolean}
         */
        this.cors = true;
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
         * Tiempo de inicio del procesado de la petición.
         *
         * @type {number}
         */
        this.time    = Date.now();
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
        const _factory = this.constructor.factory;
        this.response  = config.response || _factory.create('Response', config);
        if (this.response)
        {
            this.adapter = config.adapter || _factory.create('Adapter', config);
            if (this.adapter)
            {
                const _storage = config.storage || _factory.create('Storage', config);
                if (_storage)
                {
                    _storage.handler = this;
                    this.storage     = _storage;
                }
                else
                {
                    throw new Error('Se debe registrar una clase que extienda jf.server.storage.Base');
                }
            }
            else
            {
                throw new Error('Se debe registrar una clase que extienda jf.server.adapter.Base');
            }
        }
        else
        {
            throw new Error('Se debe registrar una clase que extienda jf.server.response.Base');
        }
    }

    /**
     * Muestra por pantalla información de la petición.
     */
    logRequest()
    {
        this.log(
            'log',
            this.constructor.name,
            '[%s][%sms] %s %s',
            this.response.statusCode,
            ('   ' + (Date.now() - this.time).toFixed(0)).substr(-3),
            this.request.method,
            this.request.url
        );
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
            const _pathname = _parsed.pathname = _parsed.pathname.split('/').filter(Boolean).join('/');
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
        if (this.cors)
        {
            this._removeCors();
        }
        this.adapter.response(this.response);
    }

    /**
     * Registra una clase como manejadora de una petición.
     */
    static register()
    {
        const _factory = this.factory;
        const _name    = this.name.match(/Handler([A-Z][a-z0-9]+)$/);
        if (_name)
        {
            const _method = _name[1].toUpperCase();
            this.extensions.forEach(
                ext => _factory.register(`Handler::${_method}::${ext}`, this)
            );
        }
    }

    /**
     * Desactiva el CORS en la petición.
     *
     * @protected
     */
    _removeCors()
    {
        const _requestHeaders  = this.request.headers;
        const _responseHeaders = this.response.headers;
        _responseHeaders.set(
            {
                'Access-Control-Allow-Credential' : 'true',
                'Access-Control-Allow-Methods'    : _requestHeaders['access-control-request-method'] || 'GET',
                'Access-Control-Allow-Origin'     : _requestHeaders.origin || _requestHeaders.host,
                'Access-Control-Max-Age'          : 86400
            }
        );
        const _headers = _requestHeaders['access-control-request-headers'];
        if (_headers)
        {
            _responseHeaders.set('Access-Control-Allow-Headers', _headers);
        }
        _responseHeaders.del('X-Frame-Options');
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
