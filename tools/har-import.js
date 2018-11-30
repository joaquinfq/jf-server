//------------------------------------------------------------------------------
// Importa el contenido de los archivos HAR en los directorios especificado y genera
// las rutas asociadas a los recursos encontrados.
//
// Acepta un archivo de configuración como primer parámetro con las siguientes claves:
// - hosts : Nombres de hosts a ser reemplazados.
// - in    : Array con las ruta de los directorios donde se buscarán los HAR.
// - out   : Directorio raíz del servidor.
//------------------------------------------------------------------------------
const jffs               = require('jf-file-system').i();
const jfServerStorageHar = require('../src/storage/Har');
const path               = require('path');
const urlParse           = require('url').parse;
const config             = require(path.resolve(process.argv[2]));
//
const request            = {
    headers : {},
    method  : 'GET'
};
const har                = new jfServerStorageHar();
har.handler              = { request };
jfServerStorageHar.ROOT  = path.resolve(config.out || '/tmp/har-splitter');

/**
 * Analiza el archivo HAR y genera un archivos HAR por cada recurso.
 *
 * @param {string} filename Ruta del archivo a analizar.
 */
function parseHar(filename)
{
    let _content = jffs.read(filename);
    if (Array.isArray(config.hosts))
    {
        config.hosts.forEach(
            host => _content = _content.replace(new RegExp(`ps?://${host}(:\\d+)?`, 'gi'), 'p://localhost:8888')
        );
    }
    const _har = JSON.parse(_content).log;
    if (_har && Array.isArray(_har.entries))
    {
        _har.entries.forEach(
            entry =>
            {
                const _status = (entry.response || {}).status;
                if (_status)
                {
                    const _request = entry.request;
                    const _url     = _request.url;
                    if (_url)
                    {
                        request.method  = _request.method;
                        har.handler.url = urlParse(_url);
                        har.create(
                            _url,
                            {
                                log : {
                                    ..._har,
                                    entries : [
                                        entry
                                    ]
                                }
                            },
                            config.overwrite || false
                        );
                    }
                }
            }
        );
    }
}
//------------------------------------------------------------------------------
// Itera sobre los directorios de manera recursiva y cada archivo HAR es analizado.
//------------------------------------------------------------------------------
config.in.forEach(
    filename =>
    {
        const _filename = path.resolve(filename);
        if (jffs.isDirectory(_filename))
        {
            jffs.scandir(_filename)
                .filter(filename => filename.toLowerCase().endsWith('.har'))
                .forEach(parseHar);
        }
    }
);
