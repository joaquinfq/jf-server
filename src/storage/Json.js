const jfServerStorageFileSystem = require('./FileSystem');
/**
 * Adaptador para usar archivos JSON almacenados en el sistema de archivos.
 *
 * @namespace jf.server.storage
 * @class     jf.server.storage.Json
 * @extends   jf.server.storage.FileSystem
 */
module.exports = class jfServerStorageJson extends jfServerStorageFileSystem
{
    /**
     * @override
     */
    static get extension()
    {
        return '.json';
    }

    /**
     * @override
     */
    create(pathname, data, overwrite = false)
    {
        if (typeof data !== 'string')
        {
            data = JSON.stringify(data);
        }

        return super.create(pathname, data, overwrite);
    }

    /**
     * @override
     */
    retrieve(pathname)
    {
        const _data = super.retrieve(pathname);

        return _data && typeof _data === 'string'
            ? JSON.parse(_data)
            : _data;
    }

    /**
     * @override
     */
    update(pathname, data)
    {
        const _filename = this.buildFilename(pathname);
        if (this.exists(_filename))
        {
            const _old = this.retrieve(pathname);
            if (_old)
            {
                data = Object.assign(_old, data);
            }
        }
        else
        {
            data = false;
        }

        return this.create(pathname, data, true);
    }
};
