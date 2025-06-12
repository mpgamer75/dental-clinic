const http = require('http');

const images = [
  '/images/vitrine_clinique1.jpg',
  '/images/vitrine_clinique2.jpg',
  '/images/vitrine_clinique3.jpg',
  '/images/diploma1.jpg',
  '/images/diploma2.jpg',
  '/images/diploma3.jpg',
  '/images/diploma4.jpg',
  '/images/diploma5.jpg',
  '/images/diploma6.jpg',
  '/images/diploma7.jpg',
  '/images/diploma8.jpg',
  '/images/diploma9.jpg',
  '/images/diploma10.jpg'
];

const baseUrl = 'http://localhost:3000';

async function testImage(imagePath) {
  return new Promise((resolve) => {
    const url = `${baseUrl}${imagePath}`;
    http.get(url, (res) => {
      const status = res.statusCode;
      const contentType = res.headers['content-type'];
      resolve({
        path: imagePath,
        status,
        contentType,
        success: status === 200 && contentType && contentType.startsWith('image/')
      });
    }).on('error', (err) => {
      resolve({
        path: imagePath,
        status: 0,
        contentType: null,
        success: false,
        error: err.message
      });
    });
  });
}

async function testAllImages() {
  console.log('🔍 Test des images sur le serveur de production...\n');
  
  const results = [];
  for (const image of images) {
    const result = await testImage(image);
    results.push(result);
    
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${image} - Status: ${result.status} - Content-Type: ${result.contentType || 'N/A'}`);
    
    if (!result.success && result.error) {
      console.log(`   Erreur: ${result.error}`);
    }
  }
  
  console.log('\n📊 Résumé:');
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  console.log(`Images accessibles: ${successCount}/${totalCount}`);
  
  if (successCount === totalCount) {
    console.log('🎉 Toutes les images sont accessibles !');
  } else {
    console.log('⚠️  Certaines images ne sont pas accessibles.');
  }
}

// Attendre un peu que le serveur démarre
setTimeout(testAllImages, 2000); 