const format        = require('util').format;
const jfFileSystem  = require('jf-file-system');
const path          = require('path');

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
            '[%s][%s] %s',
            new Date().toISOString().substr(0, 19),
            `${name || this.constructor.name.substr(8)}${' '.repeat(_length)}`.substr(0, _length),
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
};
