const Base         = require('./Base').i();
const Events       = require('events');
const jfServerBase = require('jf-server-base');
const jfServerPage = require('./Page');
const os           = require('os');
const path         = require('path');
const STATUS_CODES = require('http').STATUS_CODES;
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
        this.handlers = {};
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
         * Ruta de la raíz del servidor web.
         *
         * @property root
         * @type     {string}
         */
        this.root = config.root || path.join(__dirname, '..', 'www');
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
    checkError(handler)
    {
        this.emit('before-check-error', { handler });
        if (!handler.statusCode)
        {
            handler.statusCode = 500;
        }
        const _code = handler.statusCode;
        if (_code >= 400 && (!handler.page || !handler.page.content) && STATUS_CODES[_code])
        {
            const _page = new jfServerPage({ root : this.root });
            Object.assign(
                _page,
                {
                    title : `Error ${_code}: ${STATUS_CODES[_code]}`,
                    tpl   : 'error'
                }
            );
            handler.page = _page;
        }
        this.emit('after-check-error', { handler });
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
            handler
                ? handler.statusCode
                : 405,
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
     */
    async process(request, response)
    {
        let _service;
        const _time = Date.now();
        try
        {
            _service = this.buildHandler(
                request.method.toUpperCase(),
                request.url,
                {
                    request,
                    response,
                    root : this.root
                }
            );
            if (_service)
            {
                const _payload = {
                    request,
                    response,
                    handler : _service
                };
                this.emit('before-process', _payload);
                await _service.process();
                this.emit('after-process', _payload);
            }
            else
            {
                _service = {
                    statusCode : 405
                };
            }
        }
        catch (e)
        {
            if (_service)
            {
                _service.statusCode = 500;
            }
            else
            {
                _service = {
                    statusCode : 500
                };
            }
            console.error(e.stack);
        }
        this.send(_service, response);
        this.log(_service, request, _time);
    }

    /**
     * Registra una clase como manejadora de una petición.
     *
     * @param {string}                 method Método de la petición.
     * @param {jf.server.handler.Base} Class  Clase a registrar.
     * @param {boolean}                index  Indica si la clase también gestiona el índice de un directorio.
     */
    register(method, Class, index = false)
    {
        let _handlers = this.handlers;
        _handlers     = method in _handlers
            ? _handlers[method]
            : _handlers[method] = {};
        Class.extensions.forEach(ext => _handlers[ext] = Class);
        if (index)
        {
            _handlers['*'] = Class;
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
        this.checkError(handler);
        const _code      = handler.statusCode;
        const _headers   = handler.headers;
        const _keepAlive = handler.keepAlive;
        if (_headers)
        {
            if (_keepAlive)
            {
                _headers.set('Connection', 'keep-alive');
            }
            _headers.set('Content-Type', handler.type);
            for (const _header of _headers)
            {
                response.setHeader(_header, _headers.get(_header));
            }
        }
        response.writeHead(_code);
        let _content = handler.page.render();
        if (_content)
        {
            response.write(_content);
        }
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
        const _port = this.port;
        const _sep  = '-'.repeat(80);
        console.log(
            '%s\nURL  del servidor : http://localhost:%d\nRaíz del servidor : %s\n%s',
            _sep,
            _port,
            this.root,
            _sep
        );
        jfServerBase.create(_port, (request, response) => this.process(request, response));
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
