import mongoose from 'mongoose';

const LicenciaSchema = new mongoose.Schema({
    usuario_id: { type: String, required: true, unique: true },
    estado: { 
        type: String, 
        enum: ['Activa', 'Suspendida', 'Revocada'], 
        default: 'Activa' 
    },
    oficial_id: { type: String },
    motivo: { type: String, default: 'Sin motivo especificado' },
    fecha: { type: Date, default: Date.now }
});

export default mongoose.models.Licencia || mongoose.model('Licencia', LicenciaSchema);
