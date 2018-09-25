const fs                  = require('fs');
const jfServerStorageBase = require('./Base');
const path                = require('path');
/**
 * Adaptador para usar el sistema de archivos como soporte de los datos.
 *
 * @namespace jf.server.storage
 * @class     jf.server.storage.FileSystem
 * @extends   jf.server.storage.Base
 */
module.exports = class jfServerStorageFileSystem extends jfServerStorageBase
{
    /**
     * Construye el nombre completo del archivo del recurso.
     *
     * @param {string}  pathname     Ruta del recurso.
     * @param {boolean} addExtension Indica si se debe verificar la extensión y agregarla si no existe.
     *
     * @protected
     */
    _buildFilename(pathname, addExtension = true)
    {
        const Class      = this.constructor;
        const _extension = Class.extension;
        const _root      = Class.ROOT;
        const _filename  = pathname.includes(_root)
            ? pathname
            : path.join(_root, ...pathname.split('/'));
        //
        return addExtension && _extension && !_filename.endsWith(_extension)
            ? _filename + _extension
            : _filename;
    }

    /**
     * Ejecuta de manera segura el método de la instancia.
     *
     * @param {string} method Método a ejecutar.
     * @param {array}  args   Argumentos del método.
     *
     * @return {*} Resultado de la ejecución del método.
     *
     * @protected
     */
    _exec(method, ...args)
    {
        let _result;
        try
        {
            _result = this[method](...args);
            if (_result === undefined)
            {
                _result = true;
            }
        }
        catch (e)
        {
            this.log('error', '', e.message);
            _result = false;
        }
        //
        return _result;
    }

    /**
     * @override
     */
    create(pathname, data, overwrite = false)
    {
        const _filename = this._buildFilename(pathname);
        //
        return overwrite || !this.exists(_filename)
            ? this._exec('write', _filename, data)
            : false;
    }

    /**
     * @override
     */
    delete(pathname)
    {
        const _filename = this._buildFilename(pathname);
        //
        return this.exists(_filename)
            ? this._exec('rmdir', _filename)
            : false;
    }

    /**
     * @override
     */
    getLastId(pathname)
    {
        const _filename = this._buildFilename(pathname);
        //
        let _id         = 0;
        if (this.isDirectory(_filename))
        {
            const _ids = fs.readdirSync(_filename)
                .map(file => file.match(/^\d+/))
                .filter(Boolean)
                .map(file => parseInt(file, 10));
            if (_ids.length)
            {
                _id = Math.max(..._ids);
            }
        }
        return _id;
    }

    /**
     * @override
     */
    retrieve(pathname)
    {
        const _filename = this._buildFilename(pathname);
        //
        return this.exists(_filename)
            ? this._exec('read', _filename)
            : false;
    }

    /**
     * @override
     */
    retrieveAll(pathname)
    {
        const _filename = this._buildFilename(pathname, false);
        let _result     = this.exists(_filename) && this.isDirectory(_filename)
            ? fs.readdirSync(_filename)
                .map(file => path.join(_filename, file))
                .filter(file => this.isFile(file))
            : false;
        if (_result)
        {
            if (Array.isArray(_result))
            {
                _result = _result.map(resource => this.retrieve(resource));
            }
            else
            {
                _result = false;
            }
        }
        //
        return _result;
    }

    /**
     * @override
     */
    update(pathname, data)
    {
        return this.create(pathname, data, true);
    }
};
