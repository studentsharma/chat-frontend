import React, { useEffect, useState } from "react";
import socket from "../socket";

function Home() {
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [username, setUsername] = useState("Anil"); // dynamic later
    const [friend, setFriend] = useState("Nikita"); // dynamic later

    useEffect(() => {
        socket.emit("register-user", username);

        socket.on("receive-message", ({ from, data }) => {
            setMessages((prev) => [...prev, { from, data }]);
        });

        return () => {
            socket.off("receive-message");
        };
    }, [username]);

    const sendMessage = () => {
        socket.emit("send-message", friend, username, message);
        setMessages((prev) => [...prev, { from: username, data: message }]);
        setMessage("");
    };

    return (
        <div>
            <h2>Chat with {friend}</h2>
            <div>
                {messages.map((msg, index) => (
                    <p key={index}>
                        <strong>{msg.from}: </strong>{msg.data}
                    </p>
                ))}
            </div>
            <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Message"
            />
            <button onClick={sendMessage}>Send</button>
        </div>
    );
}

export default Home;
