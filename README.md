# Robot Asisten - Sistem Kontrol Laptop

Robot Asisten adalah sistem yang memungkinkan kontrol laptop sistem operasi Windows melalui perintah suara yang diproses oleh robot (ESP32). 
Terdiri dari backend server sebagai otak robot serta program eksekusi shell pada laptop user melalui webscoket server .

![Diagram Alur Kerja Robot Asisten](/Diagram.jpeg)

## Fitur Utama

-  Sistem autentikasi robot dengan token
-  Eksekusi perintah shell di laptop
-  Instalasi aplikasi via Winget atau URL langsung
-  Sistem logging untuk semua operasi
-  Auto-generate Python client dengan token tertanam
-  API protection dengan token validation
-  Tracking history command di database
-  Mode mencatat secara Real Time
-  Sistem Intent Recognition atau Natural Language Understanding (NLU)

## Teknologi

- **Backend**: Node.js, Express, MongoDB
- **Database**: MongoDB Atlas
- **WebSocket**: ws (WebSocket server), websocket-client (Python)
- **Client**: Python dengan library subprocess untuk eksekusi shell
- **Package Manager**: Winget (Windows Package Manager)

## Instalasi

### Prasyarat

- Node.js v14+
- MongoDB
- Python 3.7+
- Windows 10/11 dengan Winget
- ESP32 (untuk robot)

### Setup Backend

1. Clone repository
```bash
git clone https://github.com/yourusername/robot-asisten.git
cd robot-asisten/backend
```

2. Install dependencies
```bash
npm install
```

3. Setup environment variables
```bash
# Edit .env dengan konfigurasi yang sesuai
```

4. Jalankan server
```bash
npm start dev
```

### Registrasi Robot

1. Robot (ESP32) mengirim request registrasi ke backend
```http
POST /api/v1/user/register
Content-Type: application/json

{
    "name": "RKbot"
}
```

2. Backend akan menggenerate Python client dengan token tertanam
3. Salin file Python client ke laptop target

### Setup Python Client

1. Install requirements
```bash
pip install websocket-client requests tqdm
```

2. Jalankan client
```bash
python laptop_client.py
```

## API Endpoints

### Authentication
- `POST /api/v1/user/register` - Registrasi robot baru
- `POST /api/v1/user/log` - Logging aktivitas (protected)

### Commands
- `POST /api/v1/command` - Eksekusi command (protected)
- `POST /api/v1/install` - Instalasi aplikasi (protected)

## Keamanan

- Token authentication untuk semua API requests
- Satu robot aktif per sistem
- Token generation menggunakan crypto
- Validasi command sebelum eksekusi
- Logging semua aktivitas

## Penggunaan

1. Robot mengirim perintah suara yang ditranskrip
2. Backend memproses dan memvalidasi perintah
3. Python client mengeksekusi perintah di laptop
4. Hasil eksekusi python di-log ke database


## Acknowledgments

- Windows Package Manager (Winget)
- MongoDB Atlas
- WebSocket
