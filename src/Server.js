const factory      = require('jf-factory').i();
const jfServerBase = require('jf-server-base');
const jfServerTpl  = require('./Tpl');
const os           = require('os');
const path         = require('path');
const STATUS_CODES = require('http').STATUS_CODES;
/**
 * Clase que gestiona el servidor web.
 *
 * @namespace jf.server
 * @class     jf.server.Server
 */
module.exports = class jfServer
{
    /**
     * Constructor de la clase jfServer.
     *
     * @param {object} config Configuración a aplicar a la instancia.
     */
    constructor(config = {})
    {
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
     * @override
     */
    checkError(method)
    {
        const _code = method.statusCode;
        if (_code >= 400 && !method.body && STATUS_CODES[_code])
        {
            const _msg   = STATUS_CODES[_code];
            method.title = `Error ${_code} - ${_msg}`;
            method.tpl   = 'error';
            method.body  = {
                code    : _code,
                message : _msg
            };
        }
    }

    /**
     * Devuelve el manejador de la plantilla.
     *
     * @return {jf.templates.Tpl} Manejador de la plantilla.
     */
    getTpl()
    {
        let _tpl = this.tpl;
        if (!_tpl)
        {
            _tpl = this.tpl = new jfServerTpl(this);
        }
        return _tpl;
    }

    /**
     * Muestra por pantalla información de la petición.
     *
     * @param {jf.server.method.Base} method  Método que atendió la petición.
     * @param {http.IncomingMessage}  request Configuración de la petición.
     * @param {Number}                time    Marca de tiempo del inicio de la petición.
     */
    log(method, request, time)
    {
        const _code   = method
            ? method.statusCode
            : 405;
        const _length = 10;
        const _name   = method && method.constructor && method.constructor.name
            ? `${method.constructor.name.replace('jfServer', '')}${' '.repeat(_length)}`.substr(0, _length)
            : '';
        console.log(
            '[%s][%s][%s][%sms] %s %s',
            new Date().toISOString().substr(0, 19).replace('T', ' '),
            _name,
            _code,
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
    process(request, response)
    {
        const _time   = Date.now();
        const _config = {
            request,
            root : this.root
        };
        const _method = request.method.toUpperCase() + '/';
        let _service;
        try
        {
            _service = factory.create(_method + path.extname(request.url), _config) ||
                       factory.create(_method + '*', _config);
            if (_service)
            {
                _service.process();
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
     * Envía la petición al cliente.
     *
     * @param {jf.server.method.Base} method  Método que atendió la petición.
     * @param {http.ServerResponse}  response Objeto de la respuesta.
     */
    send(method, response)
    {
        this.checkError(method);
        const _code    = method.statusCode;
        const _headers = method.headers;
        if (_headers)
        {
            _headers.set('Content-Type', method.type);
            for (const _header of _headers)
            {
                response.setHeader(_header, _headers.get(_header));
            }
        }
        response.writeHead(_code);
        let _content = method.body;
        if (_content)
        {
            if (typeof _content === 'object' && !(_content instanceof Buffer))
            {
                _content = this.getTpl().render(method.tpl, _content);
            }
            response.write(_content);
        }
        response.end();
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
