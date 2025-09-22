// BML預約系統伺服器
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 靜態檔案服務
app.use(express.static('.'));

// 路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/test', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-firebase-realtime.html'));
});

app.get('/debug', (req, res) => {
    res.sendFile(path.join(__dirname, 'debug-firebase.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 BML預約系統運行在 http://localhost:${PORT}`);
    console.log('');
    console.log('✅ 系統已準備就緒！');
    console.log('📱 支援即時同步和拖曳預約功能');
    console.log('🔧 如需部署到Vercel，請參考README.md');
    console.log('');
    console.log('🔍 測試Firebase Realtime Database:');
    console.log(`   http://localhost:${PORT}/test`);
    console.log('   進行Firebase連接和資料讀寫測試');
});
