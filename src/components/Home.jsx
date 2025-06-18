import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { useUser } from './UserContext.jsx';
import io from "socket.io-client";

const Home = () => {
    const { user } = useUser();
    const [users, setUsers] = useState([])
    const [current, setCurrent] = useState("")
    const [messages, setMessages] = useState([]);
    const [msg, setMsg] = useState("");
    const [msgs, setMsgs] = useState([]);
    
    // Use useRef to persist socket connection
    const socketRef = useRef(null);
    // Ref for auto-scrolling
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom function
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Auto-scroll when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages, msgs]);

    useEffect(() => {
        if (!user) return; // Don't connect if no user
        
        // Initialize socket connection with explicit configuration
        const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";
        console.log('Connecting to socket server:', socketUrl);
        
        socketRef.current = io(socketUrl, {
            transports: ['websocket', 'polling'], // Specify transport methods
            timeout: 20000,
            forceNew: true
        });
        
        // Register user when socket connects
        socketRef.current.on('connect', () => {
            console.log('Socket connected successfully to localhost:3000');
            console.log('Socket ID:', socketRef.current.id);
            console.log('Registering user:', user);
            socketRef.current.emit('register-user', user);
            
            // Test database connection
            socketRef.current.emit('test-db');
        });
        
        // Handle test results
        socketRef.current.on('db-test-result', (data) => {
            console.log('Database test result:', data);
        });
        
        // Confirm registration
        socketRef.current.on('user-registered', (data) => {
            console.log('User registration result:', data);
        });
        
        socketRef.current.on("receive-message", (data) => {
            console.log('Received message:', data);
            console.log('Current conversation:', { current, user });
            console.log('Message from:', data.by || data.from, 'to:', data.to);
            
            // Add all received messages for now (we'll filter later)
            setMsgs((prev) => [...prev, data]);
        });

        // Handle connection errors
        socketRef.current.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });

        socketRef.current.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
        });

        // Cleanup on unmount
        return () => {
            if (socketRef.current) {
                console.log('Cleaning up socket connection');
                socketRef.current.off("receive-message");
                socketRef.current.off("connect");
                socketRef.current.off("user-registered");
                socketRef.current.off("connect_error");
                socketRef.current.off("disconnect");
                socketRef.current.off("db-test-result");
                socketRef.current.disconnect();
            }
        };
    }, [user]); // Only depend on user, not current

    const sendMessage = () => {
        if (socketRef.current && msg.trim() && current) {
            socketRef.current.emit("send-message", {
                content: msg,
                by: user,
                to: current
            });
            
            // Add message to local state immediately for better UX
            setMsgs(prev => [...prev, {
                content: msg,
                by: user,
                to: current
            }]);
            
            setMsg("");
        }
    };

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/main/get-user`, {
                    withCredentials: true
                });
                setUsers(res.data);
                console.log(res.data);
            } catch (err) {
                console.log("Error in getting users", err);
            }
        };

        fetchUsers();
    }, []);

    const handleCurrent = async (username) => {
        console.log('Switching to conversation with:', username);
        setCurrent(username);
        // Don't clear real-time messages immediately, let filtering handle it
        
        try {
            // Fix: current state won't be updated immediately, use username directly
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/messages/${user}/${username}`);
            console.log('Fetched messages:', res.data);
            setMessages(res.data); // Use res.data instead of res
        } catch (err) {
            console.log("Error fetching messages", err);
        }
    }

    // Handle Enter key press for sending messages
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    };

    return (
        <div className='flex'>
            <div className='bg-red-500 h-screen w-96 overflow-y-auto p-4'>
                <h3 className="text-white font-bold mb-4">Users</h3>
                {users.map((item, index) => (
                    <div key={index} className="mb-2">
                        <button 
                            onClick={() => handleCurrent(item.username)}
                            className={`w-full text-left p-2 rounded ${
                                current === item.username 
                                    ? 'bg-red-700 text-white' 
                                    : 'bg-white text-black hover:bg-gray-200'
                            }`}
                        >
                            {item.username}
                        </button>
                    </div>
                ))}
            </div>

            <div className="bg-blue-800 h-screen w-full flex flex-col">
                {/* Chat header */}
                {current && (
                    <div className="bg-blue-900 p-4 text-white font-bold">
                        Chat with {current}
                    </div>
                )}

                {/* Messages area */}
                <div className="flex-1 overflow-y-auto p-4">
                    {/* Database messages */}
                    {messages.map((item, key) => (
                        <div 
                            key={`db-${key}`} 
                            className={`mb-2 p-2 rounded max-w-xs ${
                                item.by === user 
                                    ? 'bg-blue-600 text-white ml-auto text-right' 
                                    : 'bg-gray-300 text-black mr-auto text-left'
                            }`}
                        >
                            <div>{item.content}</div>
                            <div className="text-xs opacity-70">DB</div>
                        </div>
                    ))}

                    {/* Real-time messages */}
                    {msgs
                        .filter(message => {
                            // Show messages for current conversation
                            const isForCurrentConversation = 
                                (message.by === current && message.to === user) || 
                                (message.by === user && message.to === current) ||
                                (message.from === current && message.to === user) || 
                                (message.from === user && message.to === current);
                            
                            console.log('Filtering message:', message, 'Show:', isForCurrentConversation);
                            return isForCurrentConversation;
                        })
                        .map((message, idx) => (
                            <div 
                                key={`rt-${idx}`}
                                className={`mb-2 p-2 rounded max-w-xs ${
                                    (message.by === user || message.from === user)
                                        ? 'bg-green-600 text-white ml-auto text-right' 
                                        : 'bg-yellow-300 text-black mr-auto text-left'
                                }`}
                            >
                                <div>{message.content || message.data}</div>
                                <div className="text-xs opacity-70">RT</div>
                            </div>
                                                    ))
                    }
                    {/* Invisible element to scroll to */}
                    <div ref={messagesEndRef} />
                </div>

                {/* Message input area */}
                {current && (
                    <div className="p-4 bg-blue-900 flex gap-2">
                        <input
                            value={msg}
                            onChange={(e) => setMsg(e.target.value)}
                            onKeyPress={handleKeyPress}
                            type="text"
                            placeholder="Type message"
                            className="flex-1 p-2 rounded"
                        />
                        <button 
                            onClick={sendMessage}
                            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                        >
                            Send
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Home