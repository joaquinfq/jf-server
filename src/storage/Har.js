const crypto              = require('crypto');
const jfServerStorageJson = require('./Json');

/**
 * Adaptador para usar archivos HAR almacenados en el sistema de archivos.
 *
 * @namespace jf.server.storage
 * @class     jf.server.storage.Har
 * @extends   jf.server.storage.Json
 */
class jfServerStorageHar extends jfServerStorageJson
{
    /**
     * @override
     */
    static get extension()
    {
        return '.har';
    }

    /**
     * @override
     */
    buildFilename(pathname, addExtension = true)
    {
        const Class = this.constructor;
        const _root = Class.ROOT;
        if (!pathname.includes(_root))
        {
            const _handler  = this.handler;
            const _request  = _handler.request;
            const _segments = [_request.method, _request.headers['x-jfserver-har-index'] || 0];
            const _url      = _handler.url;
            const _query    = _url.query;
            if (_query && Object.keys(_query).length)
            {
                _segments.push(this.paramsToHash(_query));
            }
            pathname = _url.pathname + '/' + _segments.join('-');
        }

        return super.buildFilename(pathname, addExtension);
    }

    /**
     * Genera el hash asociado a los parámetros para permitir tener múltiples archivos
     * para la misma ruta variando los parámetros.
     *
     * @param {object} params    Objeto con los parámetros.
     * @param {string} algorithm Algoritmo del hash a obtener.
     *
     * @return {string} Hash de los parámetros.
     */
    paramsToHash(params, algorithm = 'sha256')
    {
        const _params = {};
        Object.keys(params).sort().forEach(
            param => _params[param] = params[param]
        );
        const _hash = crypto.createHash(algorithm);
        _hash.update(JSON.stringify(_params));
        return _hash.digest('hex');
    }

    /**
     * @override
     */
    retrieve(pathname)
    {
        const _data = super.retrieve(pathname);

        return _data && _data.log && Array.isArray(_data.log.entries)
            ? _data.log.entries[0] || false
            : false;
    }
}

//------------------------------------------------------------------------------
jfServerStorageJson.factory.register('Storage', jfServerStorageHar);
module.exports = jfServerStorageHar;
