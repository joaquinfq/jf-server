const jfServerBase = require('./Base');
const jfServerTpl  = require('./Tpl');
/**
 * Gestiona la página a devolver.
 *
 * @namespace jf.server
 * @class     jf.server.Page
 * @extends   jf.server.Base
 */
module.exports = class jfServerPage extends jfServerBase
{
    /**
     * @override
     */
    constructor(options = {})
    {
        super();
        /**
         * Contenido de la página.
         *
         * @property content
         * @type     {Buffer|string|null}
         */
        this.content = null;
        /**
         * Reglas de estilo CSS o rutas de archivos CSS a volcar en la plantilla.
         *
         * @property css
         * @type     {string[]}
         */
        this.css = [];
        /**
         * Opciones a pasar al manejador de la plantilla.
         *
         * @property options
         * @type     {object}
         */
        this.options = options;
        /**
         * Título de la página.
         *
         * @property title
         * @type     {string}
         */
        this.title = '';
        /**
         * Nombre de la plantilla a renderizar.
         *
         * @property tpl
         * @type     {string}
         */
        this.tpl = 'html';
    }

    /**
     * Devuelve el contexto a usar para renderizar la plantilla.
     *
     * @return {object} Contexto a usar.
     */
    getContext()
    {
        const _context = {
            title : this.title,
            ...this.options
        };
        const _css     = this.css;
        if (Array.isArray(_css) && _css.length)
        {
            _context.style = _css
                .map(
                    css => css.endsWith('.css') && this.exists(css)
                        ? this.read(css)
                        : css
                )
                .join('\n\n');
        }

        return _context;
    }

    /**
     * Renderiza la plantilla para generar el código a devolver al cliente.
     *
     * @return {Buffer|string|null} Código a devolver al cliente.
     */
    render()
    {
        if (!this.content)
        {
            if (this.tpl)
            {
                this.content = new jfServerTpl(this.options).render(this.tpl, this.getContext());
            }
        }

        return this.content;
    }
};
