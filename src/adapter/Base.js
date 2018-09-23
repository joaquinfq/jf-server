/**
 * Clase base para los adaptadores de la API.
 * Un adaptador define el formato de la URL.
 *
 * @namespace jf.server.adapter
 * @class     jf.server.adapter.Base
 * @extends   jf.server.Base
 */
module.exports = class jfServerAdapterBase
{
    constructor()
    {
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
     * Aplica los parámetros recibidos en la URL al listado de registros.
     *
     * @param {object[]} records Listado de registros a modificar.
     *
     * @return {object[]} Listado de registros modificado.
     */
    apply(records)
    {
        return this.applyFilter(records);
    }

    /**
     * Aplica los filtros a un listado de registros.
     *
     * @param {object[]} records Registros a filtrar.
     *
     * @return {object[]} Listado filtrado.
     */
    applyFilter(records)
    {
        const _filter = this.filter;
        if (_filter)
        {
            const _keys = Object.keys(_filter);
            if (_keys.length && Array.isArray(records) && records.length)
            {
                // noinspection EqualityComparisonWithCoercionJS
                records = records.filter(
                    record => _keys.every(key => key in record && record[key] == _filter[key])
                );
            }
        }

        return records;
    }

    /**
     * Filtra los campos a devolver.
     *
     * @param {object[]} records Registros a filtrar.
     *
     * @return {object[]} Listado filtrado.
     */
    applyInclude(records)
    {
        const _include = this.include;
        if (_include)
        {
            const _keys = Object.keys(_include);
            if (_keys.length && Array.isArray(records) && records.length)
            {
                records = records.map(
                    record => {
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
     * Ordena los registros.
     *
     * @param {object[]} records Registros a ordenar.
     */
    applySort(records)
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
     * Analiza los parámetros de la URL y asigna las propiedades de la clase que correspondan.
     *
     * @param {string} query Parámetros de la URL a analizar.
     */
    parse(query)
    {
        console.log(query);
        throw new Error(`${this.constructor.name}::parse debe ser implementado`);
    }
};
