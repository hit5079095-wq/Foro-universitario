const { z } = require('zod');

const nombre = z.string({ error: 'El nombre es obligatorio' })
    .trim().min(1, 'El nombre es obligatorio').max(100, 'El nombre no puede superar 100 caracteres');
const correo = z.string({ error: 'El correo es obligatorio' })
    .trim().toLowerCase().email('Debe ser un correo válido');
const password = z.string({ error: 'La contraseña es obligatoria' })
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(72, 'La contraseña no puede superar 72 caracteres');

module.exports = {
    registro: z.object({ nombre, correo, password }),
    login: z.object({
        correo,
        password: z.string({ error: 'La contraseña es obligatoria' })
            .min(1, 'La contraseña es obligatoria')
    }),
    editarPerfil: z.object({ nombre }),
    cambiarPassword: z.object({
        passwordActual: z.string({ error: 'La contraseña actual es obligatoria' }).min(1, 'La contraseña actual es obligatoria'),
        passwordNueva: password
    }),
    categoria: z.object({ nombre }),
    reporte: z.object({
        titulo: z.string({ error: 'El título es obligatorio' }).trim()
            .min(5, 'El título debe tener entre 5 y 120 caracteres')
            .max(120, 'El título debe tener entre 5 y 120 caracteres'),
        descripcion: z.string({ error: 'La descripción es obligatoria' }).trim()
            .min(10, 'La descripción debe tener entre 10 y 1000 caracteres')
            .max(1000, 'La descripción debe tener entre 10 y 1000 caracteres'),
        categoriaId: z.coerce.number({ error: 'La categoría debe ser un número entero positivo' })
            .int('La categoría debe ser un número entero positivo')
            .positive('La categoría debe ser un número entero positivo')
    }),
    editarReporte: z.object({
        titulo: z.string({ error: 'El título es obligatorio' }).trim()
            .min(5, 'El título debe tener entre 5 y 120 caracteres')
            .max(120, 'El título debe tener entre 5 y 120 caracteres'),
        descripcion: z.string({ error: 'La descripción es obligatoria' }).trim()
            .min(10, 'La descripción debe tener entre 10 y 1000 caracteres')
            .max(1000, 'La descripción debe tener entre 10 y 1000 caracteres')
    }),
    comentario: z.object({
        contenido: z.string({ error: 'El contenido es obligatorio' }).trim()
            .min(1, 'El comentario debe tener entre 1 y 500 caracteres')
            .max(500, 'El comentario debe tener entre 1 y 500 caracteres')
    }),
    estado: z.object({
        estado: z.enum(['pendiente', 'en_proceso', 'resuelto'], {
            error: 'El estado debe ser pendiente, en_proceso o resuelto'
        })
    })
};
