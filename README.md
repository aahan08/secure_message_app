# 📱 Obscure – Secure Messaging App

A modern **secure messaging Android application** built using **Kotlin and Jetpack Compose**, designed with a strong focus on **privacy, encryption, and real-time communication**.

---

## 🚀 Features

### 🔐 Security First
- End-to-End Message Encryption  
- Biometric Authentication (Fingerprint / Face Unlock)  
- Panic Gesture for instant app lock / data protection  
- Anti Screen Recording / Screenshot Protection  
- Media sharing (images/files)  

### 💬 Messaging System
- Real-time chat using WebSockets  
- One-to-one and group conversations  
- Message persistence using local database  

### 🔔 Notifications
- Firebase Cloud Messaging (FCM) integration  
- Real-time push notifications  

### 📷 Smart User Connection
- QR Code-based user profile sharing and adding contacts  

---

## 🧠 Tech Stack

### 📱 Frontend
- Kotlin  
- Jetpack Compose  
- MVVM Architecture  

### 🌐 Backend & Communication
- Retrofit (API calls)  
- WebSockets (Real-time communication)  
- Firebase Cloud Messaging (FCM)  

### 🗄️ Local Storage
- Room Database  

### 🔐 Security
- Custom Cryptography (Encryption/Decryption)  
- Secure Key Management  
- Biometric Authentication  

---

## 🏗️ Architecture

The project follows **MVVM (Model-View-ViewModel)** architecture:

- **View** → Jetpack Compose UI  
- **ViewModel** → Business logic & state management  
- **Repository** → Data handling  
- **Data Layer** → API + Local Database  

---

## 📂 Project Structure

```
app/
 ┣ features/
 ┃ ┣ auth/
 ┃ ┣ chat/
 ┃ ┗ dm/
 ┣ data/
 ┃ ┣ local/
 ┃ ┣ network/
 ┃ ┗ crypto/
 ┣ security/
 ┣ ui/
 ┗ utils/
```

---

## 🔑 Key Components

- **CryptoHelper** → Handles encryption & decryption  
- **KeyManager** → Secure key storage  
- **SocketManager** → Real-time communication  
- **AppDatabase** → Local message storage  
- **AuthViewModel** → Authentication logic  

---

## ⚙️ Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/Anjisht/secure_message_app.git
```

### 2. Open in Android Studio

### 3. Add required configurations
- Firebase configuration (`google-services.json`)  
- Backend API URL  

### 4. Run the app
- Use an emulator or physical device  

---

## 🔒 Security Highlights

- Messages are encrypted before transmission  
- Secure key handling prevents unauthorized access  
- Biometric lock ensures user-level protection  
- Panic gesture provides emergency privacy control  

---

## 📌 Future Improvements

- Add message self-destruct feature  
- Implement multi-device sync  

---

## ⭐ Contribution

Contributions are welcome! Feel free to fork the repo and submit a pull request.

---

## 📜 License

This project is for educational purposes.
