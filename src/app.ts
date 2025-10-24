import express from 'express';
const app = express();
import cors from 'cors';
import router from './routes/router.js';
import unknownEndpoint from './middleware/unknownEndpoint.js';
import errorHandler from './middleware/errorHandler.js';

app.use(express.json());
app.use(cors());

app.use('/api/v1', router);
app.use(unknownEndpoint);
app.use(errorHandler);

export default app;
