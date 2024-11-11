import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import roleRoutes from './routes/roleRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/roles', roleRoutes);

export default app;
