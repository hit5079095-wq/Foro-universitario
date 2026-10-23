ALTER TABLE reportes
    ADD COLUMN estado ENUM('pendiente', 'en_proceso', 'resuelto')
        NOT NULL DEFAULT 'pendiente' AFTER usuario_id;

CREATE TABLE IF NOT EXISTS comentarios (
    id INT NOT NULL AUTO_INCREMENT,
    reporte_id INT NOT NULL,
    usuario_id INT NOT NULL,
    contenido TEXT NOT NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY comentarios_reporte_id_creado_en_idx (reporte_id, creado_en),
    KEY comentarios_usuario_id_idx (usuario_id),
    CONSTRAINT comentarios_reporte_fk
        FOREIGN KEY (reporte_id) REFERENCES reportes (id)
        ON DELETE CASCADE,
    CONSTRAINT comentarios_usuario_fk
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;