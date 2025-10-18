const fs = require('fs');
const path = require('path');

console.log('🔍 Testing file system events in Docker container...');
console.log('Current working directory:', process.cwd());
console.log('Current time:', new Date().toISOString());

// Создать watcher для текущей директории (application)
const watchPath = '.';
console.log(`📁 Watching directory: ${watchPath}`);

const watcher = fs.watch(watchPath, { recursive: true }, (eventType, filename) => {
  console.log(`📝 File ${filename} ${eventType} at ${new Date().toISOString()}`);
  
  // Проверить, что файл действительно существует
  const fullPath = path.join(watchPath, filename);
  fs.stat(fullPath, (err, stats) => {
    if (err) {
      console.log(`❌ Error accessing file ${filename}:`, err.message);
    } else {
      console.log(`✅ File ${filename} exists, size: ${stats.size} bytes`);
    }
  });
});

watcher.on('error', (error) => {
  console.error('❌ Watcher error:', error);
});

console.log('👀 Watcher created successfully!');
console.log('📝 Try changing any file in the application folder...');
console.log('⏰ Test will run for 60 seconds...');

// Завершить через 60 секунд
setTimeout(() => {
  console.log('🛑 Stopping test...');
  watcher.close();
  console.log('✅ Test completed');
  process.exit(0);
}, 60000);