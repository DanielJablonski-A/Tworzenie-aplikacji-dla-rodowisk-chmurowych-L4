<template>
  <div class="message-form">
    <h1>Message Queue</h1>
    <input
        type="text"
        v-model="message"
        placeholder="Enter your message"
    />
    <button @click="sendMessage">Send Message</button>
    <h2>Messages received from Nodejs:</h2>
    <ul>
      <li v-for="(msg, index) in receivedMessages" :key="index">
        {{ msg }}
      </li>
    </ul>
    <h2>All types of possible errors:</h2>
    <ul>
      <li v-for="(msg, index) in errors" :key="index">
        {{ msg }}
      </li>
    </ul>
    <div>
      <h2>Saved messages in MySQL:</h2>
      <ul>
        <li v-for="item in mysqlData" :key="item.id">Pobrano: Vue => Nodejs(mysql) => Vue | {{ item.content }}</li>
      </ul>
    </div>
  </div>
</template>

<script>
import {ref, onMounted, onUnmounted} from "vue";
import axios from "axios";

export default {
  name: "MessageForm",
  setup() {
    const message = ref("");
    const receivedMessages = ref([]);
    const errors = ref([]);
    const websocket = ref(null);
    const mysqlData = ref([]);

    const sendMessage = async () => {
      if (!message.value) return alert("Message cannot be empty.");
      try {
        let response = await axios.post("http://localhost:8000/api/send-message", {
          message: message.value + ' | Wysłano Vue',
        });
        console.log(response.data.error);
        if (response.data.error) {
          errors.value.push(response.data.error);
        }

        message.value = "";
      } catch (error) {
        errors.value.push("Error sending message to php: " + error);
        console.error("Error sending message:", error);
      }
    };

    onMounted(() => {
      // Connect to WebSocket server
      websocket.value = new WebSocket("ws://localhost:3000");

      websocket.value.onmessage = (event) => {
        const data = JSON.parse(event.data);
        receivedMessages.value.push(data.message + ' => Vue');
      };

      websocket.value.onopen = () => console.log("WebSocket connected.");
      websocket.value.onclose = () => console.log("WebSocket disconnected.");

      // get mysql data
      const fetchMysqlData = () => {
        axios.get('http://localhost:3001/api/data')
            .then(response => {
              mysqlData.value = response.data;
              console.log(mysqlData.value);
            })
            .catch(error => {
              console.error('Error receiving data from nodejs:', error);
              errors.value.push("Error receiving data from nodejs: " + error);
            });
      };
      fetchMysqlData();
      const intervalId = setInterval(fetchMysqlData, 3000);
      onUnmounted(() => {
        clearInterval(intervalId);
      });
    });

    return {
      message,
      receivedMessages,
      errors,
      sendMessage,
      mysqlData
    };
  }
};
</script>

<style>
.message-form {
  max-width: 800px;
  margin: 50px auto;
  text-align: center;
}

.message-form ul {
  text-align: left;
}

input {
  width: 80%;
  padding: 10px;
  margin: 10px 0;
}

button {
  padding: 10px 20px;
  cursor: pointer;
}
</style>
