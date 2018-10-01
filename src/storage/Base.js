const jfServerBase = require('../Base');
const path         = require('path');

/**
 * Clase base para los adaptadores.
 * Un adaptador permite realizar las operaciones CRUD sobre un soporte.
 *
 * @namespace jf.server.storage
 * @class     jf.server.storage.Base
 * @extends   jf.server.Base
 */
class jfServerStorageBase extends jfServerBase
{
    /**
     * Extensión que gestiona el almacenamiento.
     *
     * @property extension
     * @type     {string}
     */
    static get extension()
    {
        return '';
    }

    /**
     * Crear el recurso en el servidor.
     *
     * @param {string}  pathname  Ruta del recurso.
     * @param {*}       data      Datos del recurso.
     * @param {boolean} overwrite Indica si se debe sobrescribir el recurso si existe previamente.
     *
     * @return {boolean} `true` si se pudo realizar la operación.
     */
    create(pathname, data, overwrite = false)
    {
        console.log('CREATE: %s - %s', pathname, JSON.stringify(data));
    }

    /**
     * Elimina el recurso del servidor.
     *
     * @param {string} pathname Ruta del recurso.
     *
     * @return {boolean} `true` si se pudo realizar la operación.
     */
    delete(pathname)
    {
        console.log('DELETE: %s', pathname);
    }

    /**
     * Devuelve el ID del último recurso creado.
     *
     * @param {string} pathname Ruta del recurso.
     *
     * @return {number} Siguiente ID disponible.
     */
    getLastId(pathname)
    {
        console.log('LAST ID: %s', pathname);

        return 0;
    }

    /**
     * Recupera la información del recurso del servidor.
     *
     * @param {string} pathname Ruta del recurso.
     *
     * @return {*} La información del recurso.
     */
    retrieve(pathname)
    {
        console.log('RETRIEVE: %s', pathname);
    }

    /**
     * Devuelve la colección de todos los recurso del servidor para la ruta especificada.
     *
     * @param {string} pathname Ruta del recurso.
     *
     * @return {boolean|array} Listado de los recursos encontrados o `false` si no se pudo leer la colección.
     */
    retrieveAll(pathname)
    {
        console.log('RETRIEVE ALL: %s', pathname);

        return [];
    }

    /**
     * Actualiza la información del recurso en el servidor.
     *
     * @param {string} pathname Ruta del recurso.
     * @param {*}      data     Datos del recurso.
     *
     * @return {boolean} `true` si se pudo realizar la operación.
     */
    update(pathname, data)
    {
        console.log('UPDATE: %s - %s', pathname, JSON.stringify(data));
    }
}

//------------------------------------------------------------------------------
jfServerBase.factory.register('Storage', jfServerStorageBase);
module.exports = jfServerStorageBase;
