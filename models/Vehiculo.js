import mongoose from 'mongoose';

const vehiculoSchema = new mongoose.Schema({
    usuario_id: { type: String, required: true },
    marca: { type: String, required: true },
    modelo: { type: String, required: true },
    anio: { type: String, required: true },
    color: { type: String, required: true },
    patente: { type: String, required: true, unique: true }
}, {
    timestamps: true
});

export default mongoose.model('Vehiculo', vehiculoSchema);
