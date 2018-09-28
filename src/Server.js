const Base                = require('./Base').i();
const Events              = require('events');
const fs                  = require('fs');
const jfServerBase        = require('jf-server-base');
const jfServerHandlerBase = require('./handler/Base');
const os                  = require('os');
const path                = require('path');
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
         * Manejadores de las peticiones.
         *
         * @type {object}
         */
        this.handlers = {
            jfServerError : jfServerHandlerBase
        };
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
        let _handler = null;
        this.emit('before-build-handler', { method, url, config });
        const _handlers = this.handlers[method.toUpperCase()];
        if (_handlers)
        {
            // Si no hay una extensión usamos el nombre por si hay un
            // manejador para esa ruta.
            const _extension = path.extname(url) || path.basename(url);
            const _Class     = _handlers[_extension] || _handlers['*'];
            if (_Class)
            {
                _handler = new _Class(config);
            }
        }
        this.emit('after-build-handler', { method, url, config, handler : _handler });
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
     * Muestra por pantalla información de la petición.
     *
     * @param {jf.server.handler.Base} handler  Manejador de la petición.
     * @param {http.IncomingMessage}   request  Configuración de la petición.
     * @param {Number}                 time     Marca de tiempo del inicio de la petición.
     */
    log(handler, request, time)
    {
        Base.log(
            'log',
            this.constructor.name,
            '[%s][%sms] %s %s',
            handler.response.statusCode,
            ('   ' + (Date.now() - time).toFixed(0)).substr(-3),
            request.method,
            request.url
        );
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
        const _time = Date.now();
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
                    _handler = new this.handlers.jfServerError();
                }
                _handler.response.setError(
                    {
                        statusCode : _error
                    }
                );
            }
            this.send(_handler, response);
            this.log(_handler, request, _time);
        }
        catch (e)
        {
            console.error(e.stack);
            response.writeHead(_error || 500);
            response.end();
        }
    }

    /**
     * Registra una clase como manejadora de una petición.
     *
     * @param {string}                 method Método de la petición.
     * @param {jf.server.handler.Base} Class  Clase a registrar.
     */
    register(method, Class)
    {
        let _handlers = this.handlers;
        _handlers     = method in _handlers
            ? _handlers[method]
            : _handlers[method] = {};
        Class.extensions.forEach(ext => _handlers[ext] = Class);
    }

    /**
     * Registra todas las clases de un directorio como manejaadores de peticiones.
     * Los nombres de los archivos deben coincidir con los nombres de los métodos
     * de la petición que manejan.
     *
     * @param {string} handlersDir Directorio con los manejadores.
     */
    registerFromDir(handlersDir)
    {
        fs.readdirSync(handlersDir).forEach(
            handler =>
            {
                if (handler !== 'Base.js')
                {
                    this.register(
                        path.basename(handler, '.js').toUpperCase(),
                        require(path.join(handlersDir, handler))
                    );
                }
            }
        );
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
            `Raíz del servidor : ${Base.constructor.ROOT}`
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
