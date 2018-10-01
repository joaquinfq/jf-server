const jfServerAdapterBase = require('./Base');
const qsParse             = require('querystring').parse;

/**
 * Define un adaptador para una API sencilla.
 *
 * @namespace jf.server.adapter
 * @class     jf.server.adapter.Json
 * @extends   jf.server.adapter.Base
 */
class jfServerAdapterJson extends jfServerAdapterBase
{
    /**
     * Constructor de la clase.
     */
    constructor(...args)
    {
        super(...args);
        /**
         * Filtro a aplicar para restringir el resultado.
         *
         * @property filter
         * @type     {object|null}
         */
        this.filter = null;
        /**
         * Campos a incluir en el resultado.
         * Si no se especifica, se incluyen todos.
         *
         * @property include
         * @type     {string[]}
         */
        this.include = [];
        /**
         * Información de la paginación del resultado.
         *
         * @property pagination
         * @type     {object|null}
         */
        this.pagination = null;
        /**
         * Configuración de la ordenación.
         *
         * @property sort
         * @type     {object|null}
         */
        this.sort = null;
    }

    /**
     * Filtra los campos de los registros a devolver.
     *
     * @param {object[]} records Registros a filtrar.
     *
     * @return {object[]} Listado filtrado.
     */
    extractFields(records)
    {
        const _include = this.include;
        if (_include)
        {
            const _keys = Object.keys(_include);
            if (_keys.length && Array.isArray(records) && records.length)
            {
                records = records.map(
                    record =>
                    {
                        const _data = {};
                        _keys.forEach(
                            key =>
                            {
                                if (key in record)
                                {
                                    _data[key] = record[key];
                                }
                            }
                        );

                        return _data;
                    }
                );
            }
        }

        return records;
    }

    /**
     * Aplica los filtros a un listado de registros.
     * Por defecto el operador a aplicar es de igualdad pero puede usarse la sintáxis
     * `filter[field:op]` para indicar el operador.
     *
     * @param {object[]} records Registros a filtrar.
     *
     * @return {object[]} Listado filtrado.
     */
    filterRecords(records)
    {
        if (Array.isArray(records) && records.length)
        {
            const _filter = this.filter;
            if (_filter)
            {
                const _keys = Object.keys(_filter);
                if (_keys.length)
                {
                    records = records.filter(
                        record => _keys.every(
                            key =>
                            {
                                let _ok                          = false;
                                const [_field, _operator = 'eq'] = key.split(':');
                                if (_field in record)
                                {
                                    switch (_operator)
                                    {
                                        case 'eq':
                                            // noinspection EqualityComparisonWithCoercionJS
                                            _ok = record[_field] == _filter[_field];
                                            break;
                                        case 'ge':
                                            _ok = record[_field] >= _filter[_field];
                                            break;
                                        case 'gt':
                                            _ok = record[_field] > _filter[_field];
                                            break;
                                        case 'le':
                                            _ok = record[_field] <= _filter[_field];
                                            break;
                                        case 'lt':
                                            _ok = record[_field] < _filter[_field];
                                            break;
                                        case 'ne':
                                            // noinspection EqualityComparisonWithCoercionJS
                                            _ok = record[_field] != _filter[_field];
                                            break;
                                    }
                                }

                                return _ok;
                            }
                        )
                    );
                }
            }
        }

        return records;
    }

    /**
     * Efectúa la paginación sobre el resultado.
     *
     * @param {object[]} records Listado de registros a paginar.
     */
    paginate(records)
    {
        const _pagination = this.pagination;
        if (_pagination)
        {
            const _limit = this.pagination.limit || 10;
            const _to    = (this.pagination.index || 1) * _limit;
            records      = records.slice(_to - _limit, _to);
        }

        return records;
    }

    /**
     * Ordena los registros.
     *
     * @param {object[]} records Registros a ordenar.
     */
    sortRecords(records)
    {
        const _sort = this.sort;
        if (_sort)
        {
            const _keys = Object.keys(_sort);
            if (_keys.length && Array.isArray(records) && records.length)
            {
                // @TODO: Ordenar el resultado.
            }
        }

        return records;
    }

    /**
     * @override
     */
    request(url)
    {
        if (url && url.query)
        {
            const _config = {};
            const _query  = qsParse(url.query);
            Object.keys(_query).forEach(
                param =>
                {
                    const _match    = param.match(/([^[]+)\[([^\]]+)\]/);
                    const _property = _match && _match[1];
                    if (_property === 'filter' && _property === 'pagination')
                    {
                        if (!_config[_property])
                        {
                            _config[_property] = {};
                        }
                        _config[_property][_match[2]] = _query[param];
                    }
                    else if (param === 'include' || param === 'sort')
                    {
                        _config[param] = _query[param].split(/\s*,\s*/);
                    }
                }
            );
            Object.assign(this, _config);
        }
    }

    /**
     * @override
     */
    response(response)
    {
        if (response && !response.error)
        {
            let _data = response.data;
            if (_data && _data.length)
            {
                response.data = this.paginate(
                    this.extractFields(
                        this.sortRecords(
                            this.filterRecords(_data)
                        )
                    )
                );
            }
        }
    }
}

//------------------------------------------------------------------------------
require('../Base').factory.register('Adapter', jfServerAdapterJson);
module.exports = jfServerAdapterJson;
