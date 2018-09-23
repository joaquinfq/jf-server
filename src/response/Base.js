const jfHttpHeaders = require('jf-http-headers');
const jfServerError = require('../Error');
const jfServerBase  = require('../Base');
const jfServerTpl   = require('../Tpl');
const mimeTypes     = require('../mime-types').extensions;
const path          = require('path');
/**
 * Clase base para construir las respuestas.
 *
 * @namespace jf.server.response
 * @class     jf.server.response.Base
 * @extends   jf.server.Base
 */
module.exports = class jfServerResponseBase extends jfServerBase
{
    /**
     * @override
     */
    constructor(config = {})
    {
        super();
        /**
         * Contenido de la página.
         *
         * @property content
         * @type     {Buffer|string|null}
         */
        this.content = null;
        /**
         * Contexto a usar para renderizar la plantilla.
         *
         * @property context
         * @type     {object}
         */
        this.context = {};
        /**
         * Información del último error que ha ocurrido.
         *
         * @type {jf.server.Error|null}
         */
        this.error = null;
        /**
         * Encabezados de la respuesta.
         *
         * @property headers
         * @type     {jf.HttpHeaders}
         */
        this.headers = new jfHttpHeaders();
        /**
         * Código HTTP de respuesta.
         *
         * @property statusCode
         * @type     {number|null}
         */
        this.statusCode = null;
        /**
         * Nombre de la plantilla a renderizar.
         *
         * @property tpl
         * @type     {string}
         */
        this.tpl = '';
        /**
         * Opciones a pasar al manejador de la plantilla.
         *
         * @property tplOptions
         * @type     {object}
         */
        this.tplOptions = {};
        /**
         * TIpo de contenido de la respuesta.
         *
         * @property type
         * @type     {string}
         */
        this.type = 'text/plain; charset="UTF-8"';
        //------------------------------------------------------------------------------
        this.setProperties(config);
    }

    /**
     * Configura la respuesta a partir de un archivo local existente.
     *
     * @param {string} filename Ruta del archivo a leer.
     */
    fromFile(filename)
    {
        if (this.exists(filename))
        {
            this.content    = this.read(filename);
            this.statusCode = 200;
            const _mime     = mimeTypes[path.extname(filename)];
            if (_mime)
            {
                this.type = _mime.charset
                    ? `${_mime.type}; charset="${_mime.charset}"`
                    : _mime.type;
            }
            else
            {
                this.type = 'text/plain; charset="UTF-8"';
            }
        }
        else
        {
            this.setError(
                {
                    statusCode : 404
                }
            );
        }
    }

    /**
     * Devuelve el contexto a usar para renderizar la plantilla.
     *
     * @param {object} context Contexto a fusionar.
     *
     * @return {object} Contexto a usar.
     */
    getContext(context)
    {
        return Object.assign(
            {
                ...this.context,
                error      : this.error,
                statusCode : this.statusCode,
                tpl        : this.tpl,
                type       : this.type
            },
            context
        );
    }

    /**
     * Renderiza la plantilla para generar el código a devolver al cliente.
     *
     * @param {object} context Contexto a usar.
     *
     * @return {Buffer|string|null} Código a devolver al cliente.
     */
    render(context = {})
    {
        if (!this.content && this.tpl)
        {
            this.content = new jfServerTpl(this.tplOptions).render(this.tpl, this.getContext(context));
        }
        return this.content;
    }

    /**
     * Envía la petición al cliente.
     *
     * @param {http.ServerResponse} response Objeto de NodeJS para configurar la respuesta.
     * @param {object}              context  Contexto aportado por el servidor para renderizar la plantilla.
     */
    send(response, context = {})
    {
        const _content = this.render(context);
        //------------------------------------------------------------------------------
        // Asignación de encabezados.
        //------------------------------------------------------------------------------
        const _headers = this.headers;
        response.setHeader('Server', `jfServer/${jfServerBase.PKG.version}`);
        response.setHeader('Content-Type', this.type);
        for (const _header of _headers)
        {
            response.setHeader(_header, _headers.get(_header));
        }
        //------------------------------------------------------------------------------
        // Escritura del cuerpo de la respuesta.
        //------------------------------------------------------------------------------
        response.writeHead(this.statusCode);
        if (_content)
        {
            response.write(_content);
        }
    }

    /**
     * Asigna el error de la respuesta.
     *
     * @param {object} config Configuración del error.
     */
    setError(config)
    {
        const _error = new jfServerError(config);
        this.setProperties(
            {
                content    : '',
                error      : _error,
                statusCode : _error.statusCode,
                tpl        : 'error'
            }
        );
    }
};
