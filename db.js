import mongoose from 'mongoose';

const conectarDB = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        
        if (!uri) {
            throw new Error('No se encontró la variable MONGODB_URI en las variables de entorno de Render.');
        }

        await mongoose.connect(uri);
        console.log('✅ ¡Conectado a MongoDB Atlas exitosamente!');
    } catch (error) {
        console.error('❌ Error conectando a MongoDB Atlas:', error.message);
    }
};

// Inicia la conexión automáticamente al cargar el archivo
conectarDB();

export default mongoose;
