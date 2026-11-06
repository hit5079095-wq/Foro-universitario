module.exports = (schema) => (req, res, next) => {
    const resultado = schema.safeParse(req.body);

    if (!resultado.success) {
        const errores = resultado.error.issues.reduce((porCampo, issue) => {
            const campo = issue.path.length ? issue.path.join('.') : 'body';
            porCampo[campo] ||= [];
            porCampo[campo].push(issue.message);
            return porCampo;
        }, {});

        return res.status(400).json({
            status: 'error',
            message: 'Los datos enviados no son válidos',
            data: { errores }
        });
    }

    req.body = resultado.data;
    return next();
};
