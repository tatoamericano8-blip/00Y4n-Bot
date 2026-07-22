import pg from 'pg';
const { Pool } = pg;

// Conexión con PostgreSQL de Render
const pool = new Pool({
    // Render le pasa la URL automáticamente por las variables de entorno, o usa la URL directa
    connectionString: process.env.DATABASE_URL || 'postgresql://bot_00y4n_postgres_user:aq8O22iyv4qRVyNpdyUa79Jp7CrsJf4R@dpg-d9dta4v41pts73dscidg-a/bot_00y4n_postgres',
    ssl: {
        rejectUnauthorized: false
    }
});

// Esto crea la tabla automáticamente en Render apenas enciendes el bot
const inicializarBaseDatos = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS vehiculos (
                id SERIAL PRIMARY KEY,
                usuario_id VARCHAR(255) NOT NULL,
                marca VARCHAR(50) NOT NULL,
                modelo VARCHAR(50) NOT NULL,
                ano VARCHAR(10) NOT NULL,
                color VARCHAR(50) NOT NULL,
                patente VARCHAR(8) UNIQUE NOT NULL
            );
        `);
        console.log('✅ ¡Conectado a PostgreSQL en Render y tabla de vehículos creada exitosamente!');
    } catch (error) {
        console.error('❌ Error conectando a PostgreSQL:', error);
    }
};

inicializarBaseDatos();

export default pool;
