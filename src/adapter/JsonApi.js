const jfServerAdapterBase = require('./Base');
const qsParse             = require('querystring').parse;
/**
 * Clase base para los adaptadores de la API.
 * Un adaptador define el formato de la URL.
 *
 * @namespace jf.server.adapter
 * @class     jf.server.adapter.Base
 * @extends   jf.server.Base
 */
module.exports = class jfServerAdapterJsonApi extends jfServerAdapterBase
{
    /**
     * Analiza los parámetros de la URL y asigna las propiedades de la clase que correspondan.
     *
     * @param {string} query Parámetros de la URL a analizar.
     */
    parse(query)
    {
        if (query)
        {
            const _query  = qsParse(query);
            const _config = {};
            Object.keys(_query).forEach(
                param =>
                {
                    const _match = param.match(/([^[]+)\[([^\]]+)\]/);
                    if (_match)
                    {
                        const _property = _match[1];
                        if (_property === 'filter')
                        {
                            if (!_config.filter)
                            {
                                _config.filter = {};
                            }
                            _config.filter[_match[2]] = _query[param];
                        }
                    }
                    else
                    {
                        switch (param)
                        {
                            case 'include':
                            case 'sort':
                                _config[param] = _query[param].split(/\s*,\s*/);
                                break;
                            case 'pagination':
                                // @TODO: Analizar el formato de la paginación.
                                break;
                        }
                    }
                }
            );
            Object.assign(this, _config);
        }
    }
};
