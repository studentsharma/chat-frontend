import React from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import Login from './components/Login'
import SignUp from './components/SignUp'
import Home from "./components/Home"


const App = () => {
    return (

        <Router>
            <Toaster position="top-center" reverseOrder={false} />
            <Routes>
                <Route path="/" element={<Login />} />  
                <Route path="/signup" element={<SignUp />} />
                <Route path="/home" element={<Home />} />
            </Routes>
        </Router>
    )
}

export default App
