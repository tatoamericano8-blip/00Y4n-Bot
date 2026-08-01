import mongoose from 'mongoose';

const staffSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    rango: { type: String, default: 'Staff Trainee' },
    estado: {
      type: String,
      enum: ['ACTIVO', 'LOA', 'DESPEDIDO', 'RENUNCIADO'],
      default: 'ACTIVO'
    },

    strikes: [
      {
        idStrike: { type: String, required: true },
        motivo: { type: String, required: true },
        fecha: { type: Date, default: Date.now },
        aplicadoPor: { type: String, required: true },
        activo: { type: Boolean, default: true },
        removidoPor: { type: String, default: null },
        fechaRemovido: { type: Date, default: null },
        motivoRemocion: { type: String, default: null }
      }
    ],

    loa: {
      activo: { type: Boolean, default: false },
      inicio: Date,
      fin: Date,
      motivo: String,
      historial: [
        {
          inicio: Date,
          fin: Date,
          motivo: String,
          solicitadoEn: { type: Date, default: Date.now }
        }
      ]
    },

    premios: [
      {
        titulo: String,
        descripcion: String,
        otorgadoPor: String,
        fecha: { type: Date, default: Date.now }
      }
    ],

    cuotas: {
      horasServicio: { type: Number, default: 0 },
      sesionesOrganizadas: { type: Number, default: 0 },
      sesionesSupervisadas: { type: Number, default: 0 },
      ticketsCerrados: { type: Number, default: 0 },
      horasMeta: { type: Number, default: 3 },
      sesionesMeta: { type: Number, default: 2 }
    },

    estadisticasHistoricas: {
      horasTotales: { type: Number, default: 0 },
      sesionesHosteadasTotales: { type: Number, default: 0 },
      sesionesSupervisadasTotales: { type: Number, default: 0 },
      ticketsCerradosTotales: { type: Number, default: 0 }
    },

    ingreso: { type: Date, default: Date.now },
    despido: {
      fecha: Date,
      motivo: String,
      realizadoPor: String,
      blacklist: { type: Boolean, default: false }
    },
    renuncia: {
      fecha: Date,
      motivo: String
    }
  },
  { timestamps: true }
);

staffSchema.index({ guildId: 1, userId: 1 }, { unique: true });

export default mongoose.model('Staff', staffSchema);
