import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { useUser } from './UserContext.jsx';
import io from "socket.io-client";
import { CircleUserRound, Phone, EllipsisVertical, Video, Send, X, Menu, User, Search } from "lucide-react"
import { useNavigate } from "react-router-dom"
import toast from 'react-hot-toast';

const Home = () => {
    const navigate = useNavigate()
    const { user, setUser } = useUser();
    const [users, setUsers] = useState([])
    const [current, setCurrent] = useState("")
    const [messages, setMessages] = useState([]);
    const [msg, setMsg] = useState("");
    const [msgs, setMsgs] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    useEffect(() => {
        async function fetchData() {
            // console.log("working")
            const res = await axios.get(`${import.meta.env.VITE_SOCKET_URL}/main/me`, { withCredentials: true })
            setUser(res.data.username)
        }
        fetchData()
    }, [])

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
        if (!user) return;
        // console.log(user)

        const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";
        // console.log('Connecting to socket server:', socketUrl);

        socketRef.current = io(socketUrl, {
            transports: ['websocket', 'polling'], // Specify transport methods
            timeout: 20000,
            forceNew: true
        });

        // Register user when socket connects
        socketRef.current.on('connect', () => {

            socketRef.current.emit('register-user', user);

        });


        socketRef.current.on("receive-message", (data) => {

            setMsgs((prev) => [...prev, data]);
        });


        socketRef.current.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
        });

        // Cleanup on unmount
        return () => {
            if (socketRef.current) {
                socketRef.current.off("receive-message");
                socketRef.current.off("connect");
                socketRef.current.off("disconnect");
                socketRef.current.disconnect();
            }
        };
    }, [user]);

    const sendMessage = () => {
        if (socketRef.current && msg.trim() && current) {
            socketRef.current.emit("send-message", {
                content: msg,
                by: user,
                to: current
            });

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
                const res = await axios.get(`${import.meta.env.VITE_SOCKET_URL}/main/get-user`, {
                    withCredentials: true
                });
                setUsers(res.data);
                // console.log(res.data);
            } catch (err) {
                // console.log("Error in getting users", err);
                navigate("/")
            }
        };

        fetchUsers();
    }, []);

    const handleCurrent = async (username) => {
        // console.log('Switching to conversation with:', username);
        setCurrent(username);

        try {
            const res = await axios.get(`${import.meta.env.VITE_SOCKET_URL}/messages/${user}/${username}`);
            // console.log('Fetched messages:', res.data);
            setMessages(res.data); // Use res.data instead of res
        } catch (err) {
            // console.log("Error fetching messages", err);
        }
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    };

    const handleLogout = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_SOCKET_URL}/main/logout`, { withCredentials: true });
            toast.success("Logout Successfully")
            navigate("/")
        }
        catch (err) {
            // console.log(err);
        }

    }

    return (

        <div className="flex bg-gradient-to-br from-slate-50 to-blue-50 text-slate-800 h-screen overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar - Users List */}
            <div className={`
        fixed lg:relative
        h-full w-80 sm:w-96 lg:w-auto
        transform transition-all duration-300 ease-in-out
        z-50 lg:z-auto
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
                <div className="flex justify-center items-center h-full lg:h-auto lg:p-4">
                    <div className="bg-white/80 backdrop-blur-lg h-full lg:h-[calc(100vh-2rem)] w-full lg:w-96 shadow-2xl lg:rounded-2xl border border-white/20 flex flex-col">

                        {/* Sidebar Header */}
                        <div className="flex-shrink-0 p-4 lg:p-6 border-b border-white/20">
                            {/* Mobile close button */}
                            <div className="flex justify-between items-center mb-4 lg:mb-6">
                                <div className="flex items-center gap-3">
                                    <CircleUserRound className="w-8 h-8 text-slate-600" />
                                    <h1 className="text-lg font-semibold text-slate-800">
                                        {user}
                                    </h1>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleLogout}
                                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
                                    >
                                        Logout
                                    </button>
                                    <button
                                        onClick={() => setIsSidebarOpen(false)}
                                        className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Search */}
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    placeholder="Search friends..."
                                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                />
                                <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                    <Search className="w-5 h-5 text-slate-600" />
                                </button>
                            </div>
                        </div>

                        {/* Users List - Scrollable */}
                        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-3 overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
                            {users.map((item, index) => (
                                <div key={index}>
                                    <button
                                        onClick={() => handleCurrent(item.username)}
                                        className={`w-full text-left p-4 rounded-xl transition-all duration-200 hover:scale-[1.02] ${current === item.username
                                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                                            : 'bg-white/60 text-slate-800 hover:bg-white/80 hover:shadow-lg'
                                            }`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                                                <span className="text-white font-semibold text-sm">
                                                    {item.username.split(' ').map(n => n[0]).join('')}
                                                </span>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="font-medium truncate">
                                                    {item.username === user ? "(YOU)" : item.username}
                                                </div>
                                                <div className="text-xs text-slate-500">Online</div>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col h-full lg:p-4">
                <div className="bg-white/80 backdrop-blur-lg h-full lg:rounded-2xl shadow-2xl border border-white/20 flex flex-col overflow-hidden">

                    {/* Chat Header */}
                    {current ? (
                        <div className="flex-shrink-0 bg-gradient-to-r from-slate-900 to-slate-800 h-16 lg:h-20 flex justify-between px-4 lg:px-6 items-center lg:rounded-t-2xl">
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={() => setIsSidebarOpen(true)}
                                    className="lg:hidden text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
                                >
                                    <Menu className="w-5 h-5" />
                                </button>
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-white font-semibold text-sm">
                                            {current.split(' ').map(n => n[0]).join('')}
                                        </span>
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-white font-medium truncate">{current}</div>
                                        <div className="text-green-400 text-xs">Active now</div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2 lg:space-x-4">
                                <button className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors">
                                    <Phone className="w-5 h-5" />
                                </button>
                                <button className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors">
                                    <Video className="w-5 h-5" />
                                </button>
                                <button className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors">
                                    <EllipsisVertical className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-shrink-0 flex items-center justify-center h-16 lg:h-20 relative bg-gradient-to-r from-slate-900 to-slate-800 lg:rounded-t-2xl">
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="lg:hidden absolute left-4 p-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors"
                            >
                                <Menu className="w-5 h-5" />
                            </button>
                            <div className="text-center text-white text-lg lg:text-xl font-medium">
                                Select a friend to start chatting 👋
                            </div>
                        </div>
                    )}

                    {/* Messages Area - Scrollable */}
                    <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-3 bg-gradient-to-b from-slate-50/50 to-white/30 overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
                        {current && (
                            <>
                                {/* Database messages */}
                                {messages
                                    .filter(item => item.by === current || item.by === user)
                                    .map((item, key) => (
                                        <div
                                            key={`db-${key}`}
                                            className={`flex ${item.by === user ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[80%] sm:max-w-sm md:max-w-md p-3 lg:p-4 rounded-2xl shadow-lg ${item.by === user
                                                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-md'
                                                    : 'bg-white text-slate-800 rounded-bl-md border border-slate-200'
                                                    }`}
                                            >
                                                <div className="text-sm font-medium break-words">{item.content}</div>
                                                <div className="text-xs opacity-70 mt-1">{item.timestamp}</div>
                                            </div>
                                        </div>
                                    ))}

                                {/* Real-time messages */}
                                {msgs
                                    .filter(message => {
                                        const isForCurrentConversation =
                                            (message.by === current && message.to === user) ||
                                            (message.by === user && message.to === current) ||
                                            (message.from === current && message.to === user) ||
                                            (message.from === user && message.to === current);
                                        return isForCurrentConversation;
                                    })
                                    .map((message, idx) => (
                                        <div
                                            key={`rt-${idx}`}
                                            className={`flex ${(message.by === user || message.from === user) ? 'justify-end' : 'justify-start'
                                                }`}
                                        >
                                            <div
                                                className={`max-w-[80%] sm:max-w-sm md:max-w-md p-3 lg:p-4 rounded-2xl shadow-lg ${(message.by === user || message.from === user)
                                                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-md'
                                                    : 'bg-gradient-to-br from-yellow-300 to-yellow-400 text-slate-800 rounded-bl-md'
                                                    }`}
                                            >
                                                <div className="text-sm font-medium break-words">{message.content || message.data}</div>
                                                <div className="text-xs opacity-70 mt-1">{message.timestamp}</div>
                                            </div>
                                        </div>
                                    ))}
                            </>
                        )}

                        {!current && (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center text-slate-500">
                                    <div className="text-4xl mb-4">💬</div>
                                    <div className="text-lg font-medium">Welcome to Chat!</div>
                                    <div className="text-sm">Select a friend from the sidebar to start messaging</div>
                                </div>
                            </div>
                        )}

                        {/* Auto-scroll anchor */}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    {current && (
                        <div className="flex-shrink-0 p-4 lg:p-6 bg-white/60 backdrop-blur-sm flex gap-2 lg:gap-3 border-t border-white/20 lg:rounded-b-2xl">
                            <input
                                value={msg}
                                onChange={(e) => setMsg(e.target.value)}
                                onKeyPress={handleKeyPress}
                                type="text"
                                placeholder="Type your message..."
                                className="flex-1 p-3 lg:p-4 rounded-xl lg:rounded-2xl bg-white/80 backdrop-blur-sm border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none placeholder-slate-500 text-slate-800 text-sm lg:text-base"
                            />
                            <button
                                onClick={sendMessage}
                                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 px-4 lg:px-6 py-3 lg:py-4 rounded-xl lg:rounded-2xl transition-all duration-200 hover:scale-105 shadow-lg shadow-blue-500/25 flex-shrink-0"
                            >
                                <Send className="w-5 h-5 text-white" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Home