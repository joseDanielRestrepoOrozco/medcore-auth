import app from './app.js';
import { PORT } from './libs/config.js';

app.listen(PORT, () => {
  console.log(`Auth server is running on port ${PORT}`);
});
