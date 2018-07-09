const mimedb = require('mime-db');
const types  = {};

Object.keys(mimedb).forEach(
    type => {
        const _mime       = mimedb[type];
        const _extensions = _mime.extensions;
        if (Array.isArray(_extensions))
        {
            _mime.type = type;
            _extensions.forEach(
                extension => types['.' + extension] = _mime
            );
        }
    }
);

module.exports = {
    extensions : types,
    update(extensions, property, value)
    {
        extensions.forEach(
            extension => {
                if (extension in types)
                {
                    types[extension][property] = value;
                }
            }
        );
    }
};
