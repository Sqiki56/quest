const express = require('express');
const path = require('path');
const app = express();
const PORT = 80;

// Раздача статических файлов
app.use(express.static(__dirname));

// Обработка всех остальных запросов
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
    console.log(`Доступ из сети: http://1/:${PORT}`);
});