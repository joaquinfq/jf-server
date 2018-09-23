const format       = require('util').format;
const jfFileSystem = require('jf-file-system');
const path         = require('path');
const PKG          = require(path.join(__dirname, '..', 'package.json'));
/**
 * Ruta raíz del servidor.
 *
 * @type     {string}
 */
let root           = path.join(__dirname, '..');
/**
 * Clase base para el resto de clases del repo.
 *
 * @namespace jf.server
 * @class     jf.server.Base
 * @extends   jf.FileSystem
 */
module.exports = class jfServerBase extends jfFileSystem
{
    /**
     * Devuelve la configuración del servidor.
     *
     * @return {object} Contenido del `package.json` del servidor.
     */
    static get PKG()
    {
        return PKG;
    }

    /**
     * Devuelve la ruta raíz del servidor.
     *
     * @property ROOT
     * @type     {string}
     */
    static get ROOT()
    {
        return root;
    }

    /**
     * Asigna la ruta raíz del servidor.
     *
     * @property ROOT
     * @type     {string}
     */
    static set ROOT(value)
    {
        root = path.resolve(value);
    }

    /**
     * Devuelve el contenido del archivo.
     *
     * @param {string}   encoding Codificación del archivo a leer.
     * @param {string[]} segments Segmentos de la ruta del archivo a leer.
     *
     * @return {string|null} Contenido del archivo o `null` si no se encontró.
     */
    load(encoding, ...segments)
    {
        const _filename = this.resolve(...segments);

        return _filename && this.isFile(_filename)
            ? this.read(_filename, encoding)
            : null;
    }

    /**
     * @override
     */
    log(level, name, label, ...args)
    {
        const _length = 12;
        console[level || 'log'](
            '[%s][%s]%s%s',
            new Date().toISOString().substr(0, 19).replace('T', ' '),
            `${(name || this.constructor.name).replace('jfServer', '')}${' '.repeat(_length)}`.substr(0, _length),
            label[0] === '[' ? '' : ' ',
            format(label, ...args)
        );
    }

    /**
     * Resuelve la ruta del archivo.
     *
     * Primero busca en el directorio donde se ejecuta el servidor y si no lo encuentra
     * busca en el directorio del paquete `jf-server`.
     *
     * @param {string[]} paths Segmentos de la ruta.
     *
     * @return {string|null} Ruta del archivo o `null` si no se encontró.
     */
    resolve(...paths)
    {
        let _filename = path.resolve(...paths);
        if (!this.exists(_filename))
        {
            _filename = path.resolve(__dirname, '..', '..', ...paths);
        }

        return this.exists(_filename)
            ? _filename
            : null;
    }

    /**
     * Asigna los valores de las propiedades de la instancia.
     *
     * @param {object} values Valores a asignar.
     */
    setProperties(values)
    {
        if (values && typeof values === 'object')
        {
            for (const _property of Object.keys(values))
            {
                if (typeof this[_property] !== undefined)
                {
                    const _value = values[_property];
                    if (_value !== undefined)
                    {
                        this[_property] = _value;
                    }
                }
            }
        }
    }

    /**
     * @override
     */
    toJSON()
    {
        const _data = {};
        for (const _property of Object.keys(this))
        {
            if (_property[0] !== '_')
            {
                const _value = this[_property];
                if (_value !== undefined && typeof _value !== 'function')
                {
                    _data[_property] = _value;
                }
            }
        }

        return _data;
    }
};
