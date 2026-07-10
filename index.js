import express from 'express';
import './src/app.js';
const app = express();
app.get('/', (req, res) => res.send('¡Bot de SWFL Online 24/7 en Render!'));
app.listen(process.env.PORT || 3000, () => console.log('Servidor listo.'));
