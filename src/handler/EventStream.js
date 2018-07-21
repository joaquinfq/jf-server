const jfServerHandlerGet = require('./Base');
let eventId              = 0;
/**
 * Listado de manejadores de eventos.
 *
 * @type {object}
 */
const handlers           = {};
/**
 * Implementa la definicion de `Server Sent Events`.
 *
 * @namespace jf.server
 * @class     jf.server.handler.EventStream
 * @extends   jf.server.handler.Base
 *
 * @see       https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events
 */
module.exports = class jfServerHandlerEventStream extends jfServerHandlerGet
{
    /**
     * @override
     */
    static get extensions()
    {
        return ['sse'];
    }

    /**
     * @override
     */
    constructor(...args)
    {
        super(...args);
        /**
         * Temporizador usado para evitar timeouts.
         *
         * @type {null|number}
         */
        this.timer = null;
        /**
         * Tiempo en milisegundos del temporizador usado para evitar timeouts.
         *
         * @type {number}
         */
        this.timeout = 40000;
        //------------------------------------------------------------------------------
        this.keepAlive = true;
        const _request = this.request;
        if (_request)
        {
            const _url     = _request.url;
            handlers[_url] = this;
            _request.once('close', () => delete handlers[_url]);
        }
    }

    /**
     * Formatea el evento para poder ser enviado.
     *
     * @param {Object} event Configuración del evento.
     *
     * @return {string} Evento formateado.
     */
    formatEvent(event)
    {
        const _lines = [
            'id: ' + eventId++
        ];
        if (event.event)
        {
            _lines.push(`event: ${event.event}`);
        }
        if ('data' in event)
        {
            let _data = event.data;
            if (typeof _data === 'object')
            {
                if (Array.isArray(_data))
                {
                    _lines.push(..._data.map(i => 'data: ' + i));
                }
                else
                {
                    _lines.push('data: ' + JSON.stringify(_data));
                }
            }
            else
            {
                _lines.push('data: ' + _data);
            }
        }
        //
        return _lines.map(l => l.trim()).join('\n') + '\n\n';
    }

    /**
     * Envía un comentario al cliente para mantener abierta la conexión y evitar timeouts.
     */
    ping()
    {
        const _response = this.response;
        if (_response)
        {
            this.send(': PING (keep-alive) - ' + new Date().toISOString());
        }
    }

    /**
     * @override
     */
    async process()
    {
        this.headers.set('Cache-Control', 'no-cache');
        this.statusCode = 200;
        this.type       = 'text/event-stream';
        const _page     = this.page;
        _page.tpl       = null;
        this.send('');
    }

    /**
     * Envía la información del evento al cliente.
     *
     * @param {string} message Mensaje a enviar.
     */
    send(message)
    {
        const _response = this.response;
        if (_response)
        {
            if (message)
            {
                _response.write(message);
            }
            const _timer = this.timer;
            if (_timer)
            {
                clearTimeout(_timer);
            }
            if (this.timeout)
            {
                this.timer = setTimeout(() => this.ping(), this.timeout);
            }
        }
    }

    /**
     * Envía la información del evento usando todos los manejadores.
     *
     * @param {string} event Nombre del evento a enviar.
     * @param {*}      data  Datos del evento a enviar.
     */
    static send(event, data)
    {
        if (event)
        {
            Object.values(handlers).forEach(
                handler => handler.send(handler.formatEvent({ event, data }))
            );
        }
    }
};
