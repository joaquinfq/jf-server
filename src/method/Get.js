const factory            = require('jf-factory').i();
const fs                 = require('fs');
const mimeTypes          = require('../mime-types').extensions;
const jfServerMethodBase = require('./Base');
const path               = require('path');
const qs                 = require('querystring');

/**
 * Punto de entrada de las peticiones GET.
 *
 * @namespace jf.server.method
 * @class     jf.server.method.Get
 * @extends   jf.server.method.Base
 */
class jfServerMethodGet extends jfServerMethodBase
{
    /**
     * Construye el listado del directorio navegable.
     *
     * @param {string} dir Ruta del directorio.
     */
    buildDirectory(dir)
    {
        const _files    = fs.readdirSync(dir);
        this.statusCode = 200;
        this.tpl        = 'directory';
        this.body       = {
            dir     : dir.replace(this.root, ''),
            headers : ['Archivo', 'Tamaño', 'Fecha'],
            entries : this._formatFiles(_files.map(file => path.join(dir, file)))
        };
    }

    /**
     * Analiza la ruta del archivo y asigna los valores de la instancia según corresponda.
     *
     * @param {string} filename Ruta del archivo a analizar.
     *
     * @return {string} Contenido para la URL.
     */
    buildFile(filename)
    {
        const _body = this.load(null, filename);
        if (_body === null)
        {
            this.statusCode = 404;
        }
        else
        {
            this.body       = _body;
            this.statusCode = 200;
            this.title      = filename;
            const _mime     = mimeTypes[path.extname(filename)];
            if (_mime)
            {
                this.type = _mime.charset
                    ? `${_mime.type}; charset="${_mime.charset}"`
                    : _mime.type;
            }
        }
    }

    /**
     * Construye el índice del directorio.
     */
    buildIndex(dir)
    {
        const _indexFile = this.getIndexFile(dir);
        if (_indexFile)
        {
            this.buildFile(_indexFile);
        }
        else
        {
            this.buildDirectory(dir);
        }
    }

    /**
     * Formatea un listado de archivos para que puedan ser renderizados en una plantilla.
     *
     * @param {string[]} files Rutas de los archivos.
     *
     * @return {object} Objeto con la configuración para renderizar la plantilla.
     */
    _formatFiles(files)
    {
        if (files.length)
        {
            const _root = this.root;
            const _dir  = path.dirname(files[0]);
            const _parent = _dir === _root
                ? ''
                : path.dirname(_dir);
            if (_parent)
            {
                // Evitamos modificar el array original con unshift.
                files = [ _parent, ...files ];
            }
            files = files.map(
                file =>
                {
                    const _stat  = fs.statSync(file);
                    const _isDir = _stat.isDirectory();
                    return {
                        dir  : _isDir,
                        href : file.replace(_root, '') || '/',
                        name : file === _parent ? '..' : path.basename(file),
                        size : _isDir ? '' : _stat.size,
                        date : new Date(_stat.atimeMs).toISOString().substr(0, 19)
                    };
                }
                )
                .sort(
                    (c1, c2) => c1.dir === c2.dir
                        ? c1.name.toLowerCase().localeCompare(c2.name.toLowerCase())
                        : c1.dir
                            ? -1
                            : 1
                );
        }
        return files;
    }

    /**
     * Devuelve el archivo a usar como índice del directorio.
     *
     * @return {string|undefined} Ruta del archivo índice o `undefined` si no existe.
     */
    getIndexFile(dir, files = ['index.html', 'index.htm'])
    {
        return files
            .map(file => this.resolve(path.join(dir, file)))
            .filter(Boolean)[0];
    }

    /**
     * @override
     */
    process()
    {
        const _path = path.join(this.root, ...this.request.url.split('/').filter(s => s && s[0] !== '.'));
        if (this.exists(_path))
        {
            if (this.isDirectory(_path))
            {
                this.buildIndex(_path)
            }
            else
            {
                this.buildFile(_path);
            }
        }
        else
        {
            this.statusCode = 404;
        }
    }
}

factory.register('GET/*', jfServerMethodGet);
module.exports = jfServerMethodGet;
