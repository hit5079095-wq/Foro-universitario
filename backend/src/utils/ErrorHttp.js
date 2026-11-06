// Error de aplicación con código HTTP; manejarErrores lo convierte en { status: 'error', message, data }.
class ErrorHttp extends Error {
    constructor(status, message, data = null) {
        super(message);
        this.name = 'ErrorHttp';
        this.status = status;
        this.data = data;
    }
}

module.exports = ErrorHttp;
