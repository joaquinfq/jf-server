const fs                  = require('fs');
const jfServerHandlerBase = require('./Base');
const path                = require('path');
/**
 * Punto de entrada de las peticiones GET.
 *
 * @namespace jf.server.handler
 * @class     jf.server.handler.Get
 * @extends   jf.server.handler.Base
 */
module.exports = class jfServerHandlerGet extends jfServerHandlerBase
{
    /**
     * Extensiones que gestiona la clase.
     *
     * @return {string[]} Listado de extensiones.
     */
    static get extensions()
    {
        return ['*'];
    }

    /**
     * Construye el listado del directorio navegable.
     *
     * @param {string} dir Ruta del directorio.
     */
    async buildDirectory(dir)
    {
        const _files = fs.readdirSync(dir);
        this.response.setProperties(
            {
                context    : {
                    dir     : dir.replace(this.constructor.ROOT, '') || '/',
                    entries : this._formatFiles(_files.map(file => path.join(dir, file))),
                    headers : ['Archivo', 'Tamaño', 'Fecha']
                },
                statusCode : 200,
                tpl        : 'directory'
            }
        );
    }

    /**
     * Analiza la ruta del archivo y asigna los valores de la instancia según corresponda.
     *
     * @param {string} filename Ruta del archivo a analizar.
     *
     * @return {string} Contenido para la URL.
     */
    async buildFile(filename)
    {
        const _content = this.load(null, filename);
        if (_content === null)
        {
            this.response.setError(
                {
                    statusCode : 404
                }
            );
        }
        else
        {
            this.response.fromFile(filename);
        }
    }

    /**
     * Construye el índice del directorio.
     */
    async buildIndex(dir)
    {
        const _indexFile = this.getIndexFile(dir);
        if (_indexFile)
        {
            await this.buildFile(_indexFile);
        }
        else
        {
            await this.buildDirectory(dir);
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
            const _root   = this.constructor.ROOT;
            const _dir    = path.dirname(files[0]);
            const _parent = _dir === _root
                ? ''
                : path.dirname(_dir);
            if (_parent)
            {
                // Evitamos modificar el array original con unshift.
                files = [_parent, ...files];
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
                        ? c1.name === '..'
                            ? -1
                            : c2.name === '..'
                                ? 1
                                : c1.name.toLowerCase().localeCompare(c2.name.toLowerCase())
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
     * @param {string}        dir   Directorio donde se buscará el archivo índice.
     * @param {string[]|null} files Listado de nombres posibles del árchivo índice.
     *                              Si no se especifica se usa el predefinido por la clase.
     *
     * @return {string|null} Ruta del archivo índice o `undefined` si no existe.
     */
    getIndexFile(dir, files = null)
    {
        let _exts = this.constructor.extensions;
        let _file = null;
        ['index', 'default', 'readme'].some(
            file => _exts.some(
                ext => _file = this.resolve(path.join(dir, file) + ext) ||
                               this.resolve(path.join(dir, file.toUpperCase()) + ext)
            )
        );
        //
        return _file;
    }

    /**
     * @override
     */
    async process()
    {
        const _filename = this.getFilename();
        if (this.exists(_filename))
        {
            if (this.isDirectory(_filename))
            {
                await this.buildIndex(_filename);
            }
            else
            {
                await this.buildFile(_filename);
            }
        }
        else
        {
            this.response.setError(
                {
                    statusCode : 404
                }
            );
        }
        await super.process();
    }
};
