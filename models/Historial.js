import mongoose from 'mongoose';

const historialSchema = new mongoose.Schema({
    evento: { 
        type: String, 
        required: true,
        enum: [
            'STARTUP_INICIADO', 
            'SESION_LANZADA_RP', 
            'SESION_LANZADA_MEET', 
            'REINVITACION_CREADA', 
            'REINVITACION_LIBERADA', 
            'SESION_CERRADA',
            'SESION_CANCELADA',
            'SUPERVISION_REGISTRADA', // 🚀 Evento opcional si registras supervisiones
            'CUOTA_ACTUALIZADA'       // 🚀 Evento opcional si registras cambios de cuotas
        ]
    },
    mensajeId: { type: String, required: true }, // ID del mensaje donde ocurre la acción
    idInicio: { type: String, required: true },   // Permite vincular el evento a la Sesion raíz
    guildId: { type: String, required: true },
    hostId: { type: String, required: true },
    hostTag: { type: String, default: null },
    tipo: { type: String, enum: ['rp', 'meet'], required: true },
    
    // Objeto flexible para guardar datos puntuales del momento del evento
    detalles: { 
        type: Object, 
        default: {} 
        // Ejemplo en Cierre: { duracionMinutos: 45, motivo: 'Fin de sesión' }
        // Ejemplo en Reinvitación: { reaccionesMeta: 10, link: 'https://...' }
    },
    
    fecha: { type: Date, default: Date.now }
});

// 🚀 Índices para acelerar búsquedas de métricas del Staff y auditorías
historialSchema.index({ hostId: 1, fecha: -1 });
historialSchema.index({ guildId: 1, fecha: -1 });
historialSchema.index({ idInicio: 1 });

export default mongoose.models.Historial || mongoose.model('Historial', historialSchema);
