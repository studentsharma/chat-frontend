import React,{useState} from "react";
import axios from "axios"
import {useNavigate, Link } from "react-router-dom"

const SignUp = () => {
    const navigate = useNavigate();
    const [username, setusername] = useState("")
    const [password, setpassword] = useState("")
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_SOCKET_URL}/main/register-user`,
                {
                    username,
                    password,
                },
                {
                    withCredentials: true,
                }
            );

            console.log(response.data);
            navigate("/home")
        } catch (err) {
            console.error("Login failed:", err.response?.data || err.message);
        }
    };

    return (
        <div className="h-screen flex justify-center items-center bg-gray-100">
            <div>

                <h1 className="">SignUp </h1>
                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-4 p-6 bg-white rounded shadow w-80"
                >
                    <input
                        type="text"
                        placeholder="Enter username"
                        className="border border-gray-300 px-3 py-2 rounded"
                        onChange={(e) => setusername(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Enter password"
                        className="border border-gray-300 px-3 py-2 rounded"
                        onChange={(e) => setpassword(e.target.value)}
                    />
                    <button
                        type="submit"
                        className="bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
                    >
                        Submit
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SignUp;
