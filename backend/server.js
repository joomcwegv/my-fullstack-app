import express from 'express';
import cors from 'cors';
import 'dotenv/config';

const app = express();

// Конфигурация CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Логирование запросов
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Маршруты
app.get('/', (req, res) => {
  res.send('API работает!');
});

app.get('/api/hello', (req, res) => {
  res.json({ 
    message: "Привет от бэкенда!",
    timestamp: new Date().toISOString()
  });
});

// Обработка 404
app.use((req, res) => {
  res.status(404).json({ error: 'Не найдено' });
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  console.log(`CORS разрешен для: ${process.env.CORS_ORIGIN}`);
});