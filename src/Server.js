const Base         = require('./Base');
const Events       = require('events');
const jfServerBase = require('jf-server-base');
const os           = require('os');
const path         = require('path');
/**
 * Clase que gestiona el servidor web.
 *
 * @namespace jf.server
 * @class     jf.server.Server
 */
module.exports = class jfServerServer extends Events
{
    /**
     * Constructor de la clase jfServer.
     *
     * @param {object} config Configuración a aplicar a la instancia.
     */
    constructor(config = {})
    {
        super();
        /**
         * Nombre del host.
         *
         * @type {string}
         */
        this.host = config.host || os.hostname() || 'localhost';
        /**
         * Puerto donde escuchará el servidor web.
         *
         * @property port;
         * @type     {number}
         */
        this.port = config.port || 8888;
        /**
         * Manejador de la plantilla.
         *
         * @type {jf.templates.Tpl|null}
         */
        this.tpl = null;
    }

    /**
     * Construiye el manejador de la petición.
     *
     * @param {string} method Método de la petición.
     * @param {string} url    URL de la petición.
     * @param {object} config Configuración a aplicar al manejador.
     *
     * @return {jf.server.handler.Base|null} Manejador de la petición.
     */
    buildHandler(method, url, config = {})
    {
        const _method = method.toUpperCase();
        this.emit('before-build-handler', { method : _method, url, config });
        const _extension = path.extname(url) || path.basename(url);
        const _factory   = Base.factory;
        const _handler   = _factory.create(`Handler::${_method}::${_extension}`, config) ||
                           _factory.create(`Handler::${_method}::*`, config);
        this.emit('after-build-handler', { method : _method, url, config, handler : _handler });
        //
        return _handler;
    }

    /**
     * @override
     */
    emit(eventName, payload)
    {
        payload.event  = eventName;
        payload.server = this;
        //
        return super.emit(eventName, payload);
    }

    /**
     * Procesa la petición.
     *
     * @param {http.IncomingMessage} request  Objeto de la petición.
     * @param {http.ServerResponse}  response Objeto de la respuesta.
     * @param {string}               body     Cuerpo de la petición.
     */
    async process(request, response, body)
    {
        let _error;
        let _handler;
        try
        {
            _handler = this.buildHandler(request.method.toUpperCase(), request.url, { body, request });
            if (_handler)
            {
                // Si no es null, ocurrió un error al validar la petición.
                if (_handler.response.statusCode === null)
                {
                    const _payload = {
                        request,
                        response,
                        handler : _handler
                    };
                    this.emit('before-process', _payload);
                    await _handler.process();
                    this.emit('after-process', _payload);
                }
            }
            else
            {
                _error = 405;
            }
        }
        catch (e)
        {
            console.error(e.stack);
            _error = e.statusCode || 500;
        }
        try
        {
            if (_error)
            {
                if (!_handler)
                {
                    _handler = this.buildHandler('Handler::ERROR::*', request.url);
                }
                _handler.response.setError(
                    {
                        statusCode : _error
                    }
                );
            }
            this.send(_handler, response);
            _handler.logRequest();
        }
        catch (e)
        {
            console.error(e.stack);
            response.writeHead(_error || 500);
            response.end();
        }
    }

    /**
     * Envía la petición al cliente.
     *
     * @param {jf.server.handler.Base} handler  Manejador de la petición.
     * @param {http.ServerResponse}    response Objeto de la respuesta.
     */
    send(handler, response)
    {
        this.emit('before-send', { handler, response });
        //------------------------------------------------------------------------------
        // Envío de la respuesta.
        //------------------------------------------------------------------------------
        const _keepAlive = handler.keepAlive;
        response.setHeader('Connection', handler.keepAlive ? 'keep-alive' : 'close');
        handler.response.send(
            response,
            {
                server : {
                    host : this.host,
                    port : this.port
                }
            }
        );
        //------------------------------------------------------------------------------
        // Finalización de la petición.
        //------------------------------------------------------------------------------
        this.emit('after-send', { handler, response });
        if (!_keepAlive)
        {
            response.end();
        }
        this.emit('end', { handler, response });
    }

    /**
     * Inicia el servidor web.
     */
    start()
    {
        const _port  = this.port;
        const _lines = [
            `URL  del servidor : http://${this.host}:${_port}`,
            `Raíz del servidor : ${Base.ROOT}`
        ];
        const _sep   = '-'.repeat(Math.max(..._lines.map(l => l.length)));
        _lines.unshift(_sep);
        _lines.push(_sep);
        console.log(_lines.join('\n'));
        jfServerBase.create(_port, (request, response, body) => this.process(request, response, body));
    }

    /**
     * Modifica la configuración de los tipos MIME.
     *
     * @param {string[]} extensions Listado de extensiones a modificar.
     * @param {string}   property   Propiedad que será modificada.
     * @param {*}        value      Nuevo valor a asignar a los tipos MIME.
     */
    updateMimeTypes(extensions, property, value)
    {
        require('./mime-types').update(extensions, property, value);
    }
};
