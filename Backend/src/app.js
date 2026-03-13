import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env.js';
import apiRoutes from './routes/index.js';

const app = express();

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());
app.use(morgan('dev'));

app.use('/api', apiRoutes);

app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ message: 'Error interno del servidor.' });
});

export default app;
