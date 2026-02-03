import { createBrowserRouter } from "react-router-dom";
import Home from "../pages/Home.tsx";
import Login from "../pages/Login.tsx";
import Register from "../pages/Register.tsx";
import Layout from "../pages/layouts/Layout";
import UploadPage from "../pages/UploadPage.tsx";
import ResultPage from "../pages/ResultPage.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "",
        element: <Home />,
      },
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/register",
        element: <Register />,
      },
      {
        path: "/upload",
        element: <UploadPage />,
      },
      {
        path: "/resumes/:id",
        element: <ResultPage />,
      },
    ],
  },
]);

export default router;
