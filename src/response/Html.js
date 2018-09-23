const jfServerResponseBase = require('./Base');
/**
 * Gestiona la página a devolver.
 *
 * @namespace jf.server.response
 * @class     jf.server.response.Html
 * @extends   jf.server.response.Base
 */
module.exports = class jfServerResponseHtml extends jfServerResponseBase
{
    /**
     * @override
     */
    constructor(options = {})
    {
        super(options);
        /**
         * Reglas de estilo CSS o rutas de archivos CSS a volcar en la plantilla.
         *
         * @property css
         * @type     {string[]}
         */
        this.css = [];
        /**
         * Título de la página.
         *
         * @property title
         * @type     {string}
         */
        this.title = '';
        //------------------------------------------------------------------------------
        this.setProperties(
            {
                tpl  : 'html',
                type : 'text/html; charset=utf-8'
            }
        );
    }

    /**
     * @override
     */
    getContext(context)
    {
        const _context = super.getContext(context);
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
};
