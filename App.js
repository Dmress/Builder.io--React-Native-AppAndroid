import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
} from 'react-native';
import io from 'socket.io-client';

const SERVER_URL = 'http://ubuntu-tosh:3000';

const App = () => {
  // Состояние соединения и ID
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState('');
  
  // Состояние полей ввода
  const [testMessage, setTestMessage] = useState('Hello from React Native client!');
  
  // Состояние логов для каждого раздела
  const [messageLog, setMessageLog] = useState([]);
  const [roomLog, setRoomLog] = useState([]);
  const [broadcastLog, setBroadcastLog] = useState([]);
  const [disconnectLog, setDisconnectLog] = useState([]);

  // Референс на экземпляр сокета
  const socketRef = useRef(null);

  // Функция добавления записи в лог с типом и временной меткой
  const addLog = (logArraySetter, message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    logArraySetter(prev => [...prev, { id: Date.now(), text: `${timestamp}: ${message}`, type }]);
  };

  // Инициализация подключения
  const connect = () => {
    addLog(setMessageLog, 'Connecting to server...', 'info');
    
    socketRef.current = io(SERVER_URL, {
      transports: ['websocket', 'polling']
    });

    // Обработчики событий Socket.IO
    socketRef.current.on('connect', () => {
      setIsConnected(true);
      setSocketId(socketRef.current.id);
      addLog(setMessageLog, '✅ Connected successfully!', 'success');
    });

    socketRef.current.on('connect_error', (error) => {
      addLog(setMessageLog, `❌ Connection error: ${error.message}`, 'error');
    });

    socketRef.current.on('welcome', (msg) => {
      addLog(setMessageLog, `🤖 Server says: ${msg}`, 'info');
    });

    socketRef.current.on('server-message', (response) => {
      addLog(setMessageLog, `💬 Server response: ${response}`, 'success');
    });

    socketRef.current.on('user-joined', (userId) => {
      addLog(setRoomLog, `🧑‍🤝‍🧑 User ${userId} joined room`, 'success');
    });

    socketRef.current.on('user-left', (userId) => {
      addLog(setRoomLog, `👋 User ${userId} left room`, 'info');
    });

    socketRef.current.on('broadcast-message', (msg) => {
      addLog(setBroadcastLog, `📢 Broadcast: ${msg}`, 'success');
    });

    socketRef.current.on('disconnect', (reason) => {
      setIsConnected(false);
      setSocketId('');
      addLog(setDisconnectLog, `🔌 Disconnected: ${reason}`, 'error');
    });
  };

  // Отключение от сервера
  const disconnect = () => {
    if (socketRef.current) {
      addLog(setDisconnectLog, 'Disconnecting...', 'info');
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  // Отправка тестового сообщения
  const sendTestMessage = () => {
    if (socketRef.current) {
      socketRef.current.emit('client-message', testMessage);
      addLog(setMessageLog, `📤 Sent: ${testMessage}`, 'info');
    }
  };

  // Присоединение к комнате
  const joinRoom = () => {
    if (socketRef.current) {
      socketRef.current.emit('join-room', 'test-room');
      addLog(setRoomLog, '🚪 Joining room "test-room"', 'info');
    }
  };

  // Выход из комнаты
  const leaveRoom = () => {
    if (socketRef.current) {
      socketRef.current.emit('leave-room', 'test-room');
      addLog(setRoomLog, '🚪 Leaving room "test-room"', 'info');
    }
  };

  // Инициация широковещательной рассылки
  const broadcastMessage = () => {
    if (socketRef.current) {
      const message = `Broadcast test ${new Date().toISOString()}`;
      socketRef.current.emit('broadcast', message);
      addLog(setBroadcastLog, `📡 Broadcasting: ${message}`, 'info');
    }
  };

  // Имитация принудительного разрыва соединения
  const simulateDisconnect = () => {
    if (socketRef.current && socketRef.current.io.engine) {
      socketRef.current.io.engine.close();
      addLog(setDisconnectLog, 'Simulating network disconnect...', 'info');
    }
  };

  // Рендер логов
  const renderLog = (logData) => {
    return logData.map((entry) => (
      <Text key={entry.id} style={[styles.logEntry, styles[entry.type]]}>
        {entry.text}
      </Text>
    ));
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Full Socket.IO Server Functionality Test</Text>

      {/* Секция: Статус подключения */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Connection Status</Text>
        <View style={styles.buttonRow}>
          <Button title="Connect" onPress={connect} disabled={isConnected} />
          <Button title="Disconnect" onPress={disconnect} disabled={!isConnected} />
        </View>
        <Text style={[styles.statusText, isConnected ? styles.success : styles.error]}>
          Status: {isConnected ? `Connected (ID: ${socketId})` : 'Not connected'}
        </Text>
      </View>

      {/* Секция: Обмен сообщениями */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Message Exchange Test</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            value={testMessage}
            onChangeText={setTestMessage}
            placeholder="Type a test message..."
          />
          <Button title="Send Test Message" onPress={sendTestMessage} disabled={!isConnected} />
        </View>
        <ScrollView style={styles.logContainer}>
          {renderLog(messageLog)}
        </ScrollView>
      </View>

      {/* Секция: Тест комнат */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rooms Test</Text>
        <View style={styles.buttonRow}>
          <Button title="Join Room 'test-room'" onPress={joinRoom} disabled={!isConnected} />
          <Button title="Leave Room" onPress={leaveRoom} disabled={!isConnected} />
        </View>
        <ScrollView style={styles.logContainer}>
          {renderLog(roomLog)}
        </ScrollView>
      </View>

      {/* Секция: Тест широковещательных сообщений */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Broadcast Test</Text>
        <Button title="Broadcast Message" onPress={broadcastMessage} disabled={!isConnected} />
        <ScrollView style={styles.logContainer}>
          {renderLog(broadcastLog)}
        </ScrollView>
      </View>

      {/* Секция: Тест отключений */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Disconnection Test</Text>
        <Button title="Simulate Disconnect" onPress={simulateDisconnect} disabled={!isConnected} />
        <ScrollView style={styles.logContainer}>
          {renderLog(disconnectLog)}
        </ScrollView>
      </View>
    </ScrollView>
  );
};

// Стилизация
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'column',
    marginBottom: 10,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    fontSize: 14,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    padding: 8,
    borderRadius: 5,
  },
  logContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    height: 200,
    backgroundColor: '#f9f9f9',
  },
  logEntry: {
    fontSize: 12,
    marginBottom: 5,
    paddingVertical: 3,
    paddingHorizontal: 5,
    borderRadius: 3,
  },
  success: {
    color: '#4CAF50',
    backgroundColor: '#f0f9f0',
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  error: {
    color: '#f44336',
    backgroundColor: '#ffebee',
    borderLeftWidth: 3,
    borderLeftColor: '#f44336',
  },
  info: {
    color: '#2196F3',
    backgroundColor: '#e3f2fd',
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
});

export default App;