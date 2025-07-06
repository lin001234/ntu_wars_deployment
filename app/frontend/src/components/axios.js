import axios from "axios";

export const axiosInstance = axios.create({
    baseURL: `${process.env.CLIENT_backend_URL}/api`,
    withCredentials:true,
})