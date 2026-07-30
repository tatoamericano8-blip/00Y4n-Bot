import mongoose from 'mongoose';

const sesionSchema = new mongoose.Schema({
    idInicio: { type: String, required: true, unique: true }, // ID del mensaje de /inicio_swfl
    idLanzamiento: { type: String, default: null },           // ID del mensaje de /lanzar_rp o /lanzar_meet
    guildId: { type: String, required: true },
    hostId: { type: String, required: true },
    tipo: { type: String, enum: ['rp', 'meet'], required: true },
    reaccionesRequeridas: { type: Number, default: 0 },
    
    estado: { 
        type: String, 
        enum: ['esperando_reacciones', 'activa', 'cerrada'], 
        default: 'esperando_reacciones' 
    },

    // Enlace de Roblox
    linkSesion: { type: String, default: null },

    // Datos específicos de RP
    limiteVelocidad: { type: String, default: null },
    peacetime: { type: String, default: null },

    // Datos específicos de Car Meet
    tematica: { type: String, default: null },
    ubicacion: { type: String, default: null },
    spots: { type: String, default: null },

    // Historial de reinvitaciones dentro de la misma sesión
    reinvitaciones: [{
        idMensaje: String,
        fecha: { type: Date, default: Date.now },
        reaccionesMeta: Number,
        link: String
    }],

    // Tiempos para métricas y cuotas de Staff
    fechaInicio: { type: Date, default: Date.now },
    fechaLanzamiento: { type: Date, default: null },
    fechaCierre: { type: Date, default: null },
    duracionMinutos: { type: Number, default: 0 }
});

export default mongoose.models.Sesion || mongoose.model('Sesion', sesionSchema);
