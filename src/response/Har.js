const jfServerResponseBase = require('./Base');

/**
 * Gestiona la respuesta obtenida a partir de un archivo HAR.
 *
 * @namespace jf.server.response
 * @class     jf.server.response.Har
 * @extends   jf.server.response.Base
 */
class jfServerResponseHar extends jfServerResponseBase
{
    constructor(...args)
    {
        super(...args);
        /**
         * Encabezados que no se enviarán aunque aparezcan en el HAR.
         *
         * @type {string[]}
         */
        this.skipHeaders = [
            'Connection',
            'Content-Length',
            'Server',
            'Transfer-Encoding',
            'X-Frame-Options',
            'X-Powered-By'
        ];
    }

    /**
     * @override
     */
    render()
    {
        if (!this.content && this.data && this.data.response)
        {
            const _response = this.data.response;
            const _content  = _response.content;
            this.statusCode = _response.status;
            this.type       = _content.mimeType;
            this.content    = _content.text;
            const _rheaders = _response.headers;
            if (Array.isArray(_rheaders))
            {
                const _headers = this.headers;
                _rheaders.forEach(
                    ({ name, value }) => {
                        // El CORS lo quita el Base.js
                        if (!name.toLowerCase().startsWith('access-control-'))
                        {
                            _headers.set(name, value)
                        }
                    }
                );
                this.skipHeaders.forEach(
                    header => _headers.del(header)
                )
            }
        }
        return this.content;
    }
}

//------------------------------------------------------------------------------
jfServerResponseBase.factory.register('Response', jfServerResponseHar);
module.exports = jfServerResponseHar;
