const hbs          = require('handlebars');
const helpersHbs   = require('helpers-hbs');
const jfServerBase = require('./Base');
const path         = require('path');
const ROOT         = path.join(__dirname, '..', 'tpl');
const PKG          = require(path.join(__dirname, '..', 'package.json'));
/**
 * Maneja lo relacionado con la plantilla y la presentación del resultado.
 *
 * @namespace jf.server
 * @class     jf.server.Tpl
 * @extends   jf.server.Base
 */
module.exports = class jfServerTpl extends jfServerBase
{
    /**
     * @override
     */
    constructor(server)
    {
        super();
        /**
         * Instancia del servidor web.
         *
         * @type {jf.server.Server}
         */
        this.server = server;
        //------------------------------------------------------------------------------
        helpersHbs.registerAll(hbs);
    }

    /**
     * Agrega los helpers presentes en un directorio de manera recursiva.
     *
     * @param {string} dir Directorio donde se buscarán los helpers.
     */
    addHelpers(dir)
    {
        helpersHbs.registerAll(hbs, dir);
    }

    /**
     * Compila una plantilla desde un archivo.
     *
     * @param {string} filename Ruta de la plantilla.
     *
     * @return {function} Plantilla compilada.
     */
    compile(filename)
    {
        const _content = this.load(filename);
        return _content
            ? hbs.compile(_content, { noEscape : true })
            : () => filename;
    }

    /**
     * Carga una plantilla desde un archivo.
     *
     * @param {string} filename Ruta de la plantilla.
     *
     * @return {string} Contenido de la plantilla.
     */
    load(filename)
    {
        let _content;
        if (!filename.endsWith('.hbs'))
        {
            filename += '.hbs';
        }
        let _exists = this.exists(filename);
        if (_exists)
        {
            _content = this.read(filename);
        }
        else if (!path.isAbsolute(filename))
        {
            _content = this.load(path.resolve(this.server.root, filename)) ||
                       this.load(path.resolve(ROOT, filename));
        }
        else
        {
            _content = '';
        }
        return _content;
    }

    /**
     * Renderiza la plantilla para generar el código.
     *
     * @param {string} filename Ruta de la plantilla.
     * @param {Object} context  Contexto a usar para renderizar la plantilla.
     *
     * @return {String} Código generado con la plantilla.
     */
    render(filename, context)
    {
        return this.compile(filename)(
            {
                ...context,
                server : {
                    ...PKG,
                    ...this.server
                }
            }
        );
    }
};
