import express from 'express';
const app = express();

app.get('/', (_req, res) => {
  res.send('Auth Service is running');
});

export default app;
