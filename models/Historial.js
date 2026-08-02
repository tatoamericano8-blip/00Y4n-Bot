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
            'SESION_CERRADA_AUTO',
            'SESION_CANCELADA',
            'SUPERVISION_REGISTRADA',
            'CUOTA_ACTUALIZADA'
        ]
    },
    mensajeId: { type: String, required: true },
    idInicio: { type: String, required: true },
    guildId: { type: String, required: true },
    hostId: { type: String, required: true },
    hostTag: { type: String, default: null },
    tipo: { type: String, enum: ['rp', 'meet'], required: true },
    
    detalles: { 
        type: Object, 
        default: {} 
    },
    
    fecha: { type: Date, default: Date.now }
});

historialSchema.index({ hostId: 1, fecha: -1 });
historialSchema.index({ guildId: 1, fecha: -1 });
historialSchema.index({ idInicio: 1 });

export default mongoose.models.Historial || mongoose.model('Historial', historialSchema);
