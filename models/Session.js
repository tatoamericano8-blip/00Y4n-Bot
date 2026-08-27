import mongoose from 'mongoose';

const sesionSchema = new mongoose.Schema({
    idInicio: { type: String, required: true, unique: true },
    idLanzamiento: { type: String, default: null },
    guildId: { type: String, required: true },
    hostId: { type: String, required: true },
    coHostId: { type: String, default: null },
    supervisorId: { type: String, default: null },

    hostActivo: { type: Boolean, default: true },

    cuotaParcialPagada: [{
        userId: { type: String, required: true },
        rol: { type: String, enum: ['host', 'cohost', 'supervisor'], required: true },
        horas: { type: Number, default: 0 },
        hasta: { type: Date, default: Date.now }
    }],

    tipo: { type: String, enum: ['rp', 'meet'], required: true },
    reaccionesRequeridas: { type: Number, default: 0 },
    imagen: { type: String, default: null },

    estado: {
        type: String,
        enum: ['esperando_reacciones', 'activa', 'cerrada'],
        default: 'esperando_reacciones'
    },

    linkSesion: { type: String, default: null },

    limiteVelocidad: { type: String, default: null },
    peacetime: { type: String, default: null },
    serviciosEmergencia: { type: String, default: null },

    tematica: { type: String, default: null },
    ubicacion: { type: String, default: null },
    spots: { type: String, default: null },

    reinvitaciones: [{
        idMensaje: String,
        fecha: { type: Date, default: Date.now },
        reaccionesMeta: Number,
        link: String
    }],

    reacciones: [{
        userId: { type: String, required: true },
        fecha: { type: Date, default: Date.now }
    }],

    fechaInicio: { type: Date, default: Date.now },
    fechaLanzamiento: { type: Date, default: null },
    fechaCierre: { type: Date, default: null },
    duracionMinutos: { type: Number, default: 0 },

    cierreForzado: { type: Boolean, default: false },
    motivoCierreForzado: { type: String, default: null },
    cerradoPor: { type: String, default: null },
    cuentaParaCuota: { type: Boolean, default: true },

    // Usuarios bloqueados del link/FastPass solo durante esta sesion
    barredUserIds: { type: [String], default: [] },
    // Si true, hace falta reaccionar al /inicio para obtener el link (default)
    requiereReaccionLink: { type: Boolean, default: true }
});

export default mongoose.models.Sesion || mongoose.model('Sesion', sesionSchema);
