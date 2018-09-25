/**
 * Clase base para los adaptadores de la API.
 * Un adaptador define el formato de la URL.
 *
 * @namespace jf.server.adapter
 * @class     jf.server.adapter.Base
 * @extends   jf.server.Base
 */
module.exports = class jfServerAdapterBase
{
    /**
     * Permite configurar el adaptador conforme a los datos recibidos en la petición.
     *
     * @param {Url}                       url     Información de la URL de la petición.
     * @param {object|string|null}        body    Cuerpo de la petición.
     * @param {http.IncomingMessage|null} request Información de la petición.
     */
    request(url, request, body)
    {
    }

    /**
     * Permite modificar la respuesta a enviar al cliente en función de la implementación de la API.
     *
     * @param {jf.server.response.Base|null} response Manejador de la respuesta a enviar al cliente.
     *
     */
    response(response)
    {
    }
};
