import {
  createBrowserRouter,
} from "react-router-dom";
import Home from '../pages/Home.tsx';
import Login from '../pages/Login.tsx';
import Register from '../pages/Register.tsx';
import Layout from "../pages/layouts/Layout";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout/>,
    children : [
      {
        path :  "",
        element : <Home/>
      },
      {
        path :  "/login",
        element : <Login/>
      },
      {
        path :  "/register",
        element : <Register/>
      }
    ]
  },
]);

export default router;