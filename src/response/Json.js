const jfServerResponseBase = require('./Base');

/**
 * Gestiona la página a devolver.
 *
 * @namespace jf.server.response
 * @class     jf.server.response.Json
 * @extends   jf.server.response.Base
 */
class jfServerResponseJson extends jfServerResponseBase
{
    /**
     * @override
     */
    constructor(config = {})
    {
        super(
            Object.assign(
                {
                    type : 'application/json; charset="UTF-8"'
                }
            ),
            config
        );
        /**
         * Almacena los datos a enviar en la respuesta.
         * Los datos se serializarán usando `JSON.stringify`.
         *
         * @type {*}
         */
        this.data = null;
    }

    /**
     * @override
     */
    render()
    {
        if (!this.content)
        {
            this.content = JSON.stringify(this, null, 4);
        }
        return this.content;
    }

    /**
     * @override
     */
    toJSON()
    {
        const _result = {};
        const _error  = this.error;
        if (_error)
        {
            _result.errors = [_error];
        }
        const _data = this.data;
        if (_data)
        {
            _result.data = typeof _data === 'string'
                ? JSON.parse(_data)
                : _data;
        }
        return _result;
    }
}

//------------------------------------------------------------------------------
jfServerResponseBase.factory.register('Response', jfServerResponseJson);
module.exports = jfServerResponseJson;
